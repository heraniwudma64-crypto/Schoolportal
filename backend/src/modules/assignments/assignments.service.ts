import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  private supabase = createClient(
    process.env.SUPABASE_URL || this.extractSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'fake-key-for-now',
    { auth: { persistSession: false } }
  );

  private extractSupabaseUrl() {
    const dbUrl = process.env.DATABASE_URL || '';
    const userMatch = dbUrl.match(/postgres\.(.*?):/);
    if (userMatch) {
      return `https://${userMatch[1]}.supabase.co`;
    }
    return '';
  }

  constructor(private readonly prisma: PrismaService) {}

  private async resolveTeacher(userId?: string) {
    if (!userId) throw new UnauthorizedException('User unauthenticated');
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        OR: [{ id: userId }, { userId }],
      },
    });
    if (!teacher) throw new UnauthorizedException('Teacher profile not found');
    return teacher;
  }

  async findAll() {
    return this.prisma.assignment.findMany();
  }
  
  async findTeacherAssignments(userId: string) {
    const teacher = await this.resolveTeacher(userId);
    return this.prisma.assignment.findMany({
      where: {
        OR: [
          { teacherId: teacher.id },
          { ClassSection: { teacherId: teacher.id } },
          { ClassSection: { subjectTeachers: { some: { teacherId: teacher.id } } } },
        ],
      },
      include: {
        ClassSection: true,
        submissions: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
            grades: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async findSubmissions(id: string, userId: string) {
    const teacher = await this.resolveTeacher(userId);
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id,
        OR: [
          { teacherId: teacher.id },
          { ClassSection: { teacherId: teacher.id } },
          { ClassSection: { subjectTeachers: { some: { teacherId: teacher.id } } } },
        ],
      },
      select: { id: true },
    });
    if (!assignment) throw new UnauthorizedException('You cannot view submissions for this assignment');
    return this.prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        grades: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllTeacherSubmissions(userId: string) {
    const teacher = await this.resolveTeacher(userId);
    return this.prisma.submission.findMany({
      where: {
        assignment: {
          OR: [
            { teacherId: teacher.id },
            { ClassSection: { teacherId: teacher.id } },
            { ClassSection: { subjectTeachers: { some: { teacherId: teacher.id } } } },
          ],
        },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        assignment: {
          select: {
            id: true,
            title: true,
            subject: true,
            targetClass: true,
            dueDate: true,
            instructions: true,
            description: true,
          },
        },
        grades: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHomeroomSubmissions(userId: string) {
    const teacher = await this.resolveTeacher(userId);

    const homeroomSection = await this.prisma.classSection.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true, name: true },
    });

    if (!homeroomSection) return [];

    return this.prisma.submission.findMany({
      where: {
        assignment: {
          classSectionId: homeroomSection.id,
        },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        assignment: { select: { id: true, title: true, subject: true, dueDate: true } },
        grades: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any, userId?: string) {
    const teacher = await this.resolveTeacher(userId);

    const subjectId = data.subjectId;
    const classSectionId = data.classSectionId;
    if (!subjectId || !classSectionId) {
      throw new BadRequestException('Subject and assigned section are required');
    }

    const teachingAssignment = await this.prisma.sectionSubjectTeacher.findFirst({
      where: { teacherId: teacher.id, subjectId, classSectionId },
      include: { Subject: true, ClassSection: true },
    });
    if (!teachingAssignment) {
      throw new BadRequestException('You are not assigned to this subject and section');
    }

    return this.prisma.assignment.create({
      data: {
        title: data.title,
        subject: teachingAssignment.Subject.name,
        targetClass: teachingAssignment.ClassSection.name,
        classSectionId,
        classId: data.classId || null,
        description: data.description || data.instructions,
        instructions: data.instructions || data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        attachmentUrl: data.attachmentUrl || null,
        teacherId: teacher.id,
      },
    });
  }

  async gradeSubmission(
    submissionId: string,
    data: { score: number; maxScore?: number },
    userId: string,
  ) {
    const teacher = await this.resolveTeacher(userId);
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.assignment.teacherId !== teacher.id) {
      const section = await this.prisma.classSection.findFirst({
        where: {
          id: submission.assignment.classSectionId || undefined,
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id } } },
          ],
        },
      });
      if (!section) {
        throw new ForbiddenException('You are not authorized to grade this submission');
      }
    }

    const existingGrade = await this.prisma.grade.findFirst({
      where: { submissionId },
    });

    const score = Number(data.score);
    const maxScore = data.maxScore !== undefined ? Number(data.maxScore) : (existingGrade?.maxScore || 100);

    if (existingGrade) {
      return this.prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          score,
          maxScore,
        },
      });
    }

    return this.prisma.grade.create({
      data: {
        score,
        maxScore,
        submissionId: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        subject: submission.assignment.subject,
      },
    });
  }

  async getSubmissionFileUrl(submissionId: string, userId: string) {
    const teacher = await this.resolveTeacher(userId);
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (!submission.fileUrl) throw new NotFoundException('No file attached to this submission');

    if (submission.assignment.teacherId !== teacher.id) {
      const section = await this.prisma.classSection.findFirst({
        where: {
          id: submission.assignment.classSectionId || undefined,
          OR: [
            { teacherId: teacher.id },
            { subjectTeachers: { some: { teacherId: teacher.id } } },
          ],
        },
      });
      if (!section) {
        throw new ForbiddenException('You are not authorized to access this file');
      }
    }

    if (submission.fileUrl.startsWith('http://') || submission.fileUrl.startsWith('https://')) {
      return { url: submission.fileUrl, fileName: submission.fileName || 'submission-file' };
    }

    try {
      const { data, error } = await this.supabase.storage.from('submissions').createSignedUrl(submission.fileUrl, 3600, {
        download: submission.fileName || 'submission-file',
      });
      if (!error && data?.signedUrl) {
        return { url: data.signedUrl, fileName: submission.fileName || 'submission-file' };
      }
    } catch {
      // Fallback
    }

    const publicUrl = this.supabase.storage.from('submissions').getPublicUrl(submission.fileUrl).data.publicUrl;
    return { url: publicUrl, fileName: submission.fileName || 'submission-file' };
  }

  async findOne(id: string) {
    return this.prisma.assignment.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
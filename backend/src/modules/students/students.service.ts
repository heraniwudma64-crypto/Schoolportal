import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // --- Attendance Method ---
  async getMyAttendance(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId },
        ],
      },
      select: {
        StudentAttendance: {
          include: {
            ClassSection: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!student) {
      return [];
    }

    return student.StudentAttendance;
  }

  // --- Assignments Method ---
 // --- Assignments Method ---
  async getMyAssignments(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: userId }, { userId: userId }],
      },
      include: { ClassSection: { select: { name: true } } },
    });

    if (!student) return [];

   return this.prisma.assignment.findMany({
      // Publications can target either a section ID or the existing targetClass
      // field.  Keep both conventions without returning another section's work.
      where: {
        OR: [
          ...(student.classSectionId ? [{ classSectionId: student.classSectionId }] : []),
          ...(student.ClassSection?.name ? [{ classSectionId: null, targetClass: student.ClassSection.name }] : []),
          { classSectionId: null, targetClass: null },
        ],
      },
      include: {
        ClassSection: true,
        Teacher: {
            select: { firstName: true, lastName: true },
        },
        submissions: { where: { studentId: student.id }, select: { id: true, createdAt: true, updatedAt: true, fileName: true, grades: { select: { id: true } } } },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getMyAssignment(userId: string, assignmentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
      select: { id: true, classSectionId: true, ClassSection: { select: { name: true } } },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        OR: [
          ...(student.classSectionId ? [{ classSectionId: student.classSectionId }] : []),
          ...(student.ClassSection?.name ? [{ classSectionId: null, targetClass: student.ClassSection.name }] : []),
          { classSectionId: null, targetClass: null },
        ],
      },
      include: {
        ClassSection: { select: { name: true } },
        Teacher: { select: { firstName: true, lastName: true } },
        submissions: {
          where: { studentId: student.id },
          select: { id: true, createdAt: true, updatedAt: true, content: true, fileName: true, fileType: true, fileSize: true, grades: { select: { id: true } } },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found or you do not have access to it');
    return assignment;
  }

  async submitMyAssignment(
    userId: string,
    assignmentId: string,
    file?: Express.Multer.File,
    content?: string,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
      select: { id: true, classSectionId: true, ClassSection: { select: { name: true } } },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        OR: [
          ...(student.classSectionId ? [{ classSectionId: student.classSectionId }] : []),
          ...(student.ClassSection?.name ? [{ classSectionId: null, targetClass: student.ClassSection.name }] : []),
          { classSectionId: null, targetClass: null },
        ],
      },
      select: { id: true, dueDate: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found or you do not have access to it');
    if (assignment.dueDate < new Date()) throw new BadRequestException('The submission deadline has passed');
    if (!file && !content?.trim()) throw new BadRequestException('Attach a file or enter a response before submitting');

    const existing = await this.prisma.submission.findFirst({
      where: { assignmentId, studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });
    let uploadedPath: string | undefined;
    try {
      if (file) {
        const uploaded = await this.usersService.uploadSubmissionFile(student.id, assignmentId, file);
        uploadedPath = uploaded.path;
      }

      const data = {
        ...(content !== undefined ? { content: content.trim() || null } : {}),
        ...(file ? { fileUrl: uploadedPath!, fileName: file.originalname, fileType: file.mimetype, fileSize: file.size } : {}),
      };
      const submission = existing
        ? await this.prisma.submission.update({ where: { id: existing.id }, data, include: { grades: { select: { id: true } } } })
        : await this.prisma.submission.create({ data: { assignmentId, studentId: student.id, ...data }, include: { grades: { select: { id: true } } } });

      if (file && existing?.fileUrl && existing.fileUrl !== uploadedPath) {
        await this.usersService.removeSubmissionFile(existing.fileUrl);
      }
      return submission;
    } catch (error) {
      if (uploadedPath) await this.usersService.removeSubmissionFile(uploadedPath);
      throw error;
    }
  }

  async getStudentsByClass(classSectionId: string) {
    return await this.prisma.student.findMany({
      where: {
        classSectionId: classSectionId,
      },
    });
  }

  async getMyCourses(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          select: { academicYearId: true, gradeLevelId: true, GradeLevel: { select: { name: true } } },
        },
      },
    });
    const enrollment = student?.StudentEnrollment[0];
    if (!enrollment) return [];

    const subjects = await this.prisma.gradeSubject.findMany({
      where: {
        gradeLevelId: enrollment.gradeLevelId,
        OR: [
          { academicYearId: enrollment.academicYearId },
          { academicYearId: null },
        ],
      },
      include: { Subject: true },
      orderBy: { Subject: { name: 'asc' } },
    });

    return subjects.map(({ id, Subject }) => ({
      id,
      code: Subject.code,
      name: Subject.name,
      description: Subject.description,
      type: Subject.type,
      grade: enrollment.GradeLevel.name,
    }));
  }

  async getMySchedule(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: {
        classSectionId: true,
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          select: { classSectionId: true },
        },
      },
    });
    const classSectionId = student?.classSectionId ?? student?.StudentEnrollment[0]?.classSectionId;
    if (!classSectionId) return [];

    return this.prisma.timetable.findMany({
      where: { classSectionId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        ClassSection: { select: { name: true, roomNumber: true } },
        Subject: { select: { name: true } },
        Teacher: { select: { firstName: true, lastName: true } },
      },
    });
  }

<<<<<<< HEAD
  // students.service.ts
=======
>>>>>>> origin/main
  async getMyResults(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
      select: {
        id: true,
        classSectionId: true,
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          select: { academicYearId: true },
        },
      },
    });
    if (!student) return { grades: [], subjectResults: [] };

    // ── 1. Legacy Grade rows (component scores: mid/quiz/final etc.) ──────────
    const grades = await this.prisma.grade.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    // ── 2. Homeroom-finalized SubjectResult rows (SUBMITTED only) ─────────────
    const academicYearId = student.StudentEnrollment[0]?.academicYearId;
    const subjectResults = academicYearId
      ? await (this.prisma as any).subjectResult.findMany({
          where: {
            studentId: student.id,
            status: 'SUBMITTED',
            ...(student.classSectionId ? { classSectionId: student.classSectionId } : {}),
          },
          include: { Subject: { select: { id: true, name: true, code: true } } },
          orderBy: [{ term: 'asc' }, { Subject: { name: 'asc' } }],
        })
      : [];

    return {
      grades: grades.map((g) => ({
        id: g.id,
        subject: g.subject ?? '—',
        quarter: g.quarter ?? '—',
        mid: g.mid ?? 0,
        assignment: g.assignment ?? 0,
        quiz: g.quiz ?? 0,
        classwork: g.classwork ?? 0,
        final: g.final ?? 0,
        score: Number(g.score) || 0,
        createdAt: g.createdAt,
      })),
      subjectResults: subjectResults.map((r: any) => ({
        id: r.id,
        subjectId: r.subjectId,
        subjectName: r.Subject?.name ?? '—',
        subjectCode: r.Subject?.code ?? '—',
        term: r.term,
        marks: r.marks,
        status: r.status,
        updatedAt: r.updatedAt,
      })),
    };
  }

  // --- Heran's Method ---
  async getStudentsBySection(sectionIdentifier: string) {
    const decodedIdentifier = decodeURIComponent(sectionIdentifier).trim();

    const section = await this.prisma.classSection.findFirst({
      where: {
        OR: [
          { id: decodedIdentifier },
          { name: decodedIdentifier },
        ],
      },
    });

    if (!section) {
      return [];
    }

    return this.prisma.student.findMany({
      where: { classSectionId: section.id },
      include: {
        User: {
          select: {
            id: true,
            loginId: true,
            email: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }
}

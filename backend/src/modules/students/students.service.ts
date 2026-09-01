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
    console.log("DEBUG: Looking up attendance for JWT User ID:", userId);

    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId },
        ],
      },
    });

    console.log("DEBUG: Found student record:", student);

    if (!student) {
      return [];
    }

    const records = await this.prisma.studentAttendance.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        ClassSection: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log("DEBUG: Found attendance records count:", records.length);
    return records;
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
      select: { id: true },
    });
    if (!student) return [];

    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: { studentId: student.id, status: 'ACTIVE' },
      orderBy: { enrollmentDate: 'desc' },
      select: { academicYearId: true, gradeLevelId: true, GradeLevel: { select: { name: true } } },
    });
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

  // students.service.ts
async getMyResults(userId: string) {
    // 1. Find the student linked to this user ID
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: userId }, { userId: userId }] },
    });
    
    if (!student) return [];

    // 2. Query the grade table directly without any invalid relation includes
    return await this.prisma.grade.findMany({
      where: { studentId: student.id },
    });
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

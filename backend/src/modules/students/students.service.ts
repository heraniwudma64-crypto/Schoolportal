import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

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
  async getMyAssignments(userId?: string) {
    if (!userId) {
      return this.prisma.assignment.findMany({
        orderBy: { dueDate: 'asc' },
        include: {
          Teacher: {
            select: { firstName: true, lastName: true },
          },
        },
      });
    }

    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: userId }, { userId: userId }],
      },
    });

    if (!student) return [];

   return await this.prisma.assignment.findMany({
      where: {
        OR: [
          { classSectionId: student.classSectionId },
          { classSectionId: null },
        ],
      },
      include: {
        ClassSection: true,
        Teacher: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
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
          where: { status: 'ACTIVE', classSectionId: { not: null } },
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
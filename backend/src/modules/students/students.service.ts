import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyAttendance(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) return [];

    return this.prisma.studentAttendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        period: true,
        status: true,
        remarks: true,
        ClassSection: { select: { name: true } },
        User: { select: { Teacher: { select: { firstName: true, lastName: true } } } },
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

  async getMyResults(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) return [];

    return this.prisma.examAttempt.findMany({
      where: { studentId: student.id },
      orderBy: { Exam: { examDate: 'desc' } },
      select: {
        id: true,
        marksObtained: true,
        grade: true,
        remarks: true,
        Exam: {
          select: {
            title: true,
            totalMarks: true,
            examDate: true,
            type: true,
            Subject: { select: { name: true } },
            Term: { select: { name: true } },
          },
        },
      },
    });
  }
}

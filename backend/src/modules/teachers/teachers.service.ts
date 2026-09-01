import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve the Teacher entity ID whether passed a Teacher ID or Auth User ID
   */
  private async resolveTeacherId(idOrUserId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        OR: [
          { id: idOrUserId },
          { userId: idOrUserId },
        ],
      },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher.id;
  }

  async getAllTeachers() {
    return this.prisma.teacher.findMany({
      orderBy: { lastName: 'asc' },
    });
  }

  async getTeacherDashboardStats(idOrUserId: string) {
    try {
      const teacherId = await this.resolveTeacherId(idOrUserId);

      const sectionCount = await this.prisma.classSection.count({
        where: { teacherId },
      });

      return { sectionCount };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Teacher profile not found');
      }
      throw error;
    }
  }

  async getAssignedClasses(idOrUserId: string) {
    try {
      const teacherId = await this.resolveTeacherId(idOrUserId);

      return this.prisma.classSection.findMany({
        where: { teacherId },
        include: { 
          GradeLevel: true, 
          students: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Teacher profile not found');
      }
      throw error;
    }
  }

  async getTeachingAssignments(userId: string) {
    try {
      const teacherId = await this.resolveTeacherId(userId);
      return this.prisma.sectionSubjectTeacher.findMany({
        // Grade entry must only expose current, active class-subject work.
        // A teacher profile or homeroom assignment is not a subject assignment.
        where: {
          teacherId,
          AcademicYear: { isCurrent: true },
          ClassSection: { status: 'ACTIVE' },
        },
        select: {
          id: true,
          subjectId: true,
          classSectionId: true,
          academicYearId: true,
          Subject: { select: { id: true, name: true, code: true } },
          ClassSection: { select: { id: true, name: true, GradeLevel: { select: { name: true } } } },
        },
        orderBy: [{ ClassSection: { name: 'asc' } }, { Subject: { name: 'asc' } }],
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Teacher profile not found');
      }
      throw error;
    }
  }

  async getDashboard(userId: string) {
    try {
      const teacherId = await this.resolveTeacherId(userId);
      const assignments = await this.prisma.sectionSubjectTeacher.findMany({
        where: { teacherId },
        select: { subjectId: true, classSectionId: true },
      });
      const sectionIds = [...new Set(assignments.map((assignment) => assignment.classSectionId))];
      const [assignmentCount, pendingExamCount, activeStudentCount, attendanceRecords, recentAssignments, recentExams] = await Promise.all([
        this.prisma.assignment.count({ where: { teacherId } }),
        this.prisma.examination.count({ where: { teacherId, status: 'PENDING' } }),
        sectionIds.length ? this.prisma.student.count({ where: { classSectionId: { in: sectionIds }, status: 'ACTIVE' } }) : 0,
        sectionIds.length ? this.prisma.studentAttendance.findMany({
          where: { classSectionId: { in: sectionIds } },
          select: { status: true },
          orderBy: { date: 'desc' },
          take: 100,
        }) : [],
        this.prisma.assignment.findMany({ where: { teacherId }, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
        this.prisma.examination.findMany({ where: { teacherId }, select: { id: true, title: true, status: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 3 }),
      ]);

      const presentCount = attendanceRecords.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length;
      const actions = [
        ...recentAssignments.map((item) => ({ id: `assignment-${item.id}`, type: 'assignment', text: `Published assignment: ${item.title}`, at: item.createdAt })),
        ...recentExams.map((item) => ({ id: `exam-${item.id}`, type: 'exam', text: `${item.status === 'DRAFT' ? 'Saved draft' : 'Updated exam'}: ${item.title}`, at: item.updatedAt })),
      ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 5);

      return {
        assignedSubjectsCount: new Set(assignments.map((assignment) => assignment.subjectId)).size,
        activeStudentsCount: activeStudentCount,
        assignmentsPublishedCount: assignmentCount,
        pendingExamsCount: pendingExamCount,
        attendance: { recordsReviewed: attendanceRecords.length, presentCount, absentCount: attendanceRecords.length - presentCount },
        recentActions: actions,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Teacher profile not found. Please contact your administrator.');
      }
      console.error('Error loading dashboard:', error);
      throw new InternalServerErrorException('Failed to load teacher dashboard');
    }
  }

  async getMyHomeroomContext(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const homeroomSection = await this.prisma.classSection.findFirst({
      where: { teacherId: teacher.id },
      include: {
        GradeLevel: true,
        students: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      teacherId: teacher.id,
      isHomeroomTeacher: !!homeroomSection,
      assignedSection: homeroomSection
        ? {
            id: homeroomSection.id,
            name: homeroomSection.name,
            grade: homeroomSection.GradeLevel?.name,
            studentCount: homeroomSection.students.length,
          }
        : null,
    };
  }

  async verifyHomeroomAccess(userId: string, classSectionId: string) {
    const context = await this.getMyHomeroomContext(userId);
    if (!context.isHomeroomTeacher || context.assignedSection?.id !== classSectionId) {
      throw new ForbiddenException('You are not authorized as the homeroom teacher for this section.');
    }
  }
}

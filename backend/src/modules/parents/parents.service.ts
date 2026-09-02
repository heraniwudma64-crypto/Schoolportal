import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportCardsService } from '../report-cards/report-cards.service';

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportCardsService: ReportCardsService,
  ) {}

  /**
   * Resolve Parent profile for the authenticated User ID.
   */
  async getMyProfile(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        User: {
          select: {
            id: true,
            loginId: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    return {
      id: parent.id,
      userId: parent.userId,
      firstName: parent.firstName,
      lastName: parent.lastName,
      fullName: `${parent.firstName} ${parent.lastName}`.trim(),
      phoneNumber: parent.phoneNumber ?? parent.User?.phoneNumber ?? null,
      occupation: parent.occupation,
      relationship: parent.relationship,
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
      user: parent.User,
    };
  }

  /**
   * Get all active linked children for the authenticated parent.
   */
  async getMyChildren(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const students = await this.prisma.student.findMany({
      where: {
        parentId: parent.id,
        User: { isDeleted: false },
      },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        gender: true,
        dob: true,
        address: true,
        emergencyContact: true,
        status: true,
        classSectionId: true,
        ClassSection: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            GradeLevel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            enrollmentDate: true,
            status: true,
            AcademicYear: {
              select: {
                id: true,
                year: true,
                isCurrent: true,
              },
            },
            GradeLevel: {
              select: {
                id: true,
                name: true,
              },
            },
            ClassSection: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return students.map((student) => {
      const activeEnrollment = student.StudentEnrollment?.[0];
      return {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        gender: student.gender,
        dob: student.dob,
        address: student.address,
        emergencyContact: student.emergencyContact,
        status: student.status,
        avatarUrl: student.User?.avatarUrl || null,
        classSection: student.ClassSection
          ? {
              id: student.ClassSection.id,
              name: student.ClassSection.name,
              roomNumber: student.ClassSection.roomNumber,
              gradeLevel: student.ClassSection.GradeLevel?.name || null,
            }
          : null,
        currentEnrollment: activeEnrollment
          ? {
              id: activeEnrollment.id,
              academicYear: activeEnrollment.AcademicYear?.year || null,
              gradeLevel: activeEnrollment.GradeLevel?.name || null,
              classSection: activeEnrollment.ClassSection?.name || null,
            }
          : null,
      };
    });
  }

  /**
   * Critical Security Method:
   * Validates that the authenticated parent is the authorized parent of the specified student.
   * Throws ForbiddenException if the student does not belong to this parent.
   */
  async validateChildOwnership(parentUserId: string, studentId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: parentUserId },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: parent.id,
        User: { isDeleted: false },
      },
      include: {
        ClassSection: {
          include: {
            GradeLevel: true,
            AcademicYear: true,
          },
        },
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          include: {
            AcademicYear: true,
            GradeLevel: true,
            ClassSection: true,
          },
          take: 1,
        },
        User: {
          select: {
            id: true,
            loginId: true,
            email: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to view or access this student record.',
      );
    }

    return student;
  }

  /**
   * 1. Attendance: GET /parents/me/children/:studentId/attendance
   */
  async getChildAttendance(parentUserId: string, studentId: string) {
    const student = await this.validateChildOwnership(parentUserId, studentId);

    const records = await this.prisma.studentAttendance.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        ClassSection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    for (const record of records) {
      if (record.status === 'PRESENT') presentCount++;
      else if (record.status === 'ABSENT') absentCount++;
      else if (record.status === 'LATE') lateCount++;
      else if (record.status === 'EXCUSED') excusedCount++;
    }

    const totalDays = records.length;
    const attendancePercentage =
      totalDays > 0 ? Math.round(((presentCount + lateCount + excusedCount) / totalDays) * 100) : 0;

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        avatarUrl: student.User?.avatarUrl || null,
        classSection: student.ClassSection?.name || null,
      },
      summary: {
        totalDays,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendancePercentage,
      },
      records: records.map((r) => ({
        id: r.id,
        date: r.date,
        period: r.period,
        status: r.status,
        remarks: r.remarks,
        classSection: r.ClassSection?.name || null,
      })),
    };
  }

  /**
   * 2. Results: GET /parents/me/children/:studentId/results
   *
   * Returns both legacy Grade rows (component scores) AND homeroom-finalized
   * SubjectResult rows (SUBMITTED) so parents see the complete picture.
   */
  async getChildResults(parentUserId: string, studentId: string) {
    const student = await this.validateChildOwnership(parentUserId, studentId);

    // ── Legacy Grade rows ────────────────────────────────────────────────────
    const grades = await this.prisma.grade.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    // ── Homeroom-finalized SubjectResult rows (SUBMITTED) ────────────────────
    const classSectionId =
      student.classSectionId ?? student.StudentEnrollment?.[0]?.classSectionId;
    const academicYearId = student.StudentEnrollment?.[0]?.academicYearId;

    const subjectResults =
      classSectionId && academicYearId
        ? await (this.prisma as any).subjectResult.findMany({
            where: {
              studentId: student.id,
              classSectionId,
              academicYearId,
              status: 'SUBMITTED',
            },
            include: { Subject: { select: { id: true, name: true, code: true } } },
            orderBy: [{ term: 'asc' }, { Subject: { name: 'asc' } }],
          })
        : [];

    const examResults = await this.prisma.studentExamResult.findMany({
      where: { studentId: student.id },
      include: { examination: { include: { Subject: true } } },
      orderBy: { submittedAt: 'desc' },
    });

    const examAttempts = await this.prisma.examAttempt.findMany({
      where: { studentId: student.id },
      include: { Examination: { include: { Subject: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalScore = grades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
    const average = grades.length > 0 ? Math.round((totalScore / grades.length) * 10) / 10 : 0;

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        avatarUrl: student.User?.avatarUrl || null,
        classSection: student.ClassSection?.name || null,
      },
      overallAverage: average,
      totalRecords: grades.length,
      grades: grades.map((g) => {
        const total = Number(g.score) || 0;
        const letterGrade =
          total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';
        return {
          id: g.id,
          subject: g.subject || '—',
          quarter: g.quarter || '—',
          mid: g.mid ?? 0,
          assignment: g.assignment ?? 0,
          quiz: g.quiz ?? 0,
          classwork: g.classwork ?? 0,
          final: g.final ?? 0,
          score: total,
          gradeLetter: letterGrade,
          createdAt: g.createdAt,
        };
      }),
      // Term-by-term finalized results from the homeroom teacher
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
      examResults: examResults.map((er) => ({
        id: er.id,
        examId: er.examId,
        examTitle: er.examination?.title || '—',
        subject: er.examination?.Subject?.name || '—',
        score: er.score,
        totalMarks: er.totalMarks,
        marksObtained: er.marksObtained,
        submittedAt: er.submittedAt,
      })),
      examAttempts: examAttempts.map((ea) => ({
        id: ea.id,
        examId: ea.examId,
        examTitle: ea.Examination?.title || '—',
        subject: ea.Examination?.Subject?.name || '—',
        marksObtained: ea.marksObtained,
        grade: ea.grade,
        remarks: ea.remarks,
        createdAt: ea.createdAt,
      })),
    };
  }

  /**
   * 3. Report Card: GET /parents/me/children/:studentId/report-card
   */
  async getChildReportCard(parentUserId: string, studentId: string, termId?: string) {
    const student = await this.validateChildOwnership(parentUserId, studentId);

    const classSectionId =
      student.classSectionId ?? student.StudentEnrollment?.[0]?.classSectionId;

    const academicYearId =
      student.ClassSection?.academicYearId ??
      student.StudentEnrollment?.[0]?.academicYearId;

    const availableTerms = academicYearId
      ? await this.reportCardsService.getTerms(academicYearId)
      : [];

    let targetTermId = termId;
    if (!targetTermId && availableTerms.length > 0) {
      targetTermId = availableTerms[0].id;
    }

    let reportCardData: any = null;
    if (classSectionId && targetTermId) {
      try {
        reportCardData = await this.reportCardsService.getReportCard(
          student.id,
          classSectionId,
          targetTermId,
        );
      } catch (err: any) {
        // Return null data if report card is not published/computed yet
        reportCardData = null;
      }
    }

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        avatarUrl: student.User?.avatarUrl || null,
        classSection: student.ClassSection?.name || null,
      },
      availableTerms,
      selectedTermId: targetTermId || null,
      reportCard: reportCardData,
    };
  }

  /**
   * 4. Assignments: GET /parents/me/children/:studentId/assignments
   */
  async getChildAssignments(parentUserId: string, studentId: string) {
    const student = await this.validateChildOwnership(parentUserId, studentId);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        OR: [
          { classSectionId: student.classSectionId },
          { classSectionId: null },
        ],
      },
      include: {
        ClassSection: {
          select: {
            id: true,
            name: true,
          },
        },
        Teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        submissions: {
          where: { studentId: student.id },
          select: {
            id: true,
            createdAt: true,
          },
        },
        StudentAssignment: {
          where: { studentId: student.id },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    let submittedCount = 0;
    let pendingCount = 0;

    const formattedAssignments = assignments.map((a) => {
      const isSubmitted =
        (a.submissions && a.submissions.length > 0) ||
        a.StudentAssignment?.[0]?.status === 'SUBMITTED' ||
        a.StudentAssignment?.[0]?.status === 'GRADED';
      const status = isSubmitted
        ? a.StudentAssignment?.[0]?.status || 'SUBMITTED'
        : 'PENDING';

      if (isSubmitted) submittedCount++;
      else pendingCount++;

      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        description: a.description,
        instructions: a.instructions,
        dueDate: a.dueDate,
        attachmentUrl: a.attachmentUrl,
        teacherName: a.Teacher ? `${a.Teacher.firstName} ${a.Teacher.lastName}`.trim() : null,
        classSection: a.ClassSection?.name || 'All Classes',
        submissionStatus: status,
        submittedAt: a.submissions?.[0]?.createdAt ?? null,
      };
    });

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        avatarUrl: student.User?.avatarUrl || null,
        classSection: student.ClassSection?.name || null,
      },
      totalAssignments: formattedAssignments.length,
      submittedCount,
      pendingCount,
      assignments: formattedAssignments,
    };
  }

  /**
   * 5. Schedule: GET /parents/me/children/:studentId/schedule
   */
  async getChildSchedule(parentUserId: string, studentId: string) {
    const student = await this.validateChildOwnership(parentUserId, studentId);

    const classSectionId =
      student.classSectionId ?? student.StudentEnrollment?.[0]?.classSectionId;

    if (!classSectionId) {
      return {
        student: {
          id: student.id,
          admissionNo: student.admissionNo,
          fullName: `${student.firstName} ${student.lastName}`.trim(),
          avatarUrl: student.User?.avatarUrl || null,
          classSection: null,
        },
        schedule: [],
      };
    }

    const timetable = await this.prisma.timetable.findMany({
      where: { classSectionId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        ClassSection: { select: { name: true, roomNumber: true } },
        Subject: { select: { name: true, code: true } },
        Teacher: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        avatarUrl: student.User?.avatarUrl || null,
        classSection: student.ClassSection?.name || null,
      },
      schedule: timetable.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectName: slot.Subject?.name || '—',
        subjectCode: slot.Subject?.code || '—',
        teacherName: slot.Teacher ? `${slot.Teacher.firstName} ${slot.Teacher.lastName}`.trim() : '—',
        roomNumber: slot.ClassSection?.roomNumber || '—',
      })),
    };
  }
}

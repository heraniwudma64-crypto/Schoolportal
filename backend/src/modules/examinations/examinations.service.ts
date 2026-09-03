import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ExamStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM DATA
  // ─────────────────────────────────────────────────────────────────────────────

  async getTeacherFormData(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const assignments = await this.prisma.sectionSubjectTeacher.findMany({
      where: { teacherId: teacher.id },
      select: {
        subjectId: true,
        classSectionId: true,
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true, GradeLevel: { select: { name: true } } } },
      },
      orderBy: [{ ClassSection: { name: 'asc' } }, { Subject: { name: 'asc' } }],
    });
    return { assignments };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER EXAM CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async findTeacherExaminations(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');
    return this.prisma.examination.findMany({
      where: { teacherId: teacher.id },
      include: { Subject: true, Class: true, ClassSection: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExamination(dto: any, userId?: string) {
    let teacherId: string | undefined;
    if (userId) {
      const t = await this.prisma.teacher.findUnique({ where: { userId } });
      if (t) teacherId = t.id;
    }
    const subjectId = dto.subjectId || (typeof dto.subject === 'string' ? dto.subject : undefined);
    if (!subjectId) throw new BadRequestException('Subject is required');
    if (!teacherId) throw new UnauthorizedException('Active user is not registered as a teacher');

    const teachingAssignment = await this.prisma.sectionSubjectTeacher.findFirst({
      where: { teacherId, subjectId, classSectionId: dto.classSectionId },
    });
    if (!teachingAssignment) throw new BadRequestException('You are not assigned to this subject and section');

    const classId = dto.classId || (await this.prisma.class.findFirst({ select: { id: true } }))?.id;
    if (!classId) throw new BadRequestException('A class must be configured before creating an examination');

    const calculatedTotalMarks =
      dto.questions?.length > 0
        ? dto.questions.reduce((s: number, q: any) => s + (Number(q.marks) || 10), 0)
        : dto.totalMarks || 100;

    const examId = crypto.randomUUID();
    const now = new Date();
    try {
      return await this.prisma.$transaction(async (tx) => {
        return tx.examination.create({
          data: {
            id: examId,
            title: dto.title || 'Untitled Examination',
            subjectId,
            classId,
            classSectionId: dto.classSectionId,
            ...(teacherId ? { teacherId } : {}),
            duration: Number(dto.duration) || 60,
            status:
              dto.status === 'DRAFT' ? ExamStatus.DRAFT :
              dto.status === 'APPROVED' ? ExamStatus.APPROVED :
              ExamStatus.PENDING,
            totalMarks: calculatedTotalMarks,
            examDate: dto.examDate ? new Date(dto.examDate) : now,
            updatedAt: now,
            questions: {
              create: (dto.questions || []).map((q: any) => ({
                id: crypto.randomUUID(),
                text: q.questionText || q.text || '',
                options: {
                  create: (q.options || []).map((opt: any) => ({
                    id: crypto.randomUUID(),
                    optionText: opt.optionText || opt.text || '',
                    isCorrect: Boolean(opt.isCorrect),
                  })),
                },
              })),
            },
          },
          include: { questions: { include: { options: true } } },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to create examination: ${error.message}`);
    }
  }

  async updateExamination(id: string, dto: any, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const existing = await this.prisma.examination.findUnique({ where: { id } });
    if (!teacher || !existing || existing.teacherId !== teacher.id) {
      throw new UnauthorizedException('You cannot edit this examination');
    }
    if (dto.subjectId || dto.classSectionId) {
      const subjectId = dto.subjectId || existing.subjectId;
      const classSectionId = dto.classSectionId || existing.classSectionId;
      const assignment = await this.prisma.sectionSubjectTeacher.findFirst({
        where: { teacherId: teacher.id, subjectId, classSectionId },
      });
      if (!assignment) throw new BadRequestException('You are not assigned to this subject and section');
    }

    const updateData: any = {
      title: dto.title,
      instructions: dto.instructions,
      duration: dto.duration ? Number(dto.duration) : undefined,
      status: dto.status ? (dto.status as ExamStatus) : undefined,
      updatedAt: new Date(),
    };
    if (dto.subjectId) updateData.subjectId = dto.subjectId;
    if (dto.classId) updateData.classId = dto.classId;
    if (dto.classSectionId) updateData.classSectionId = dto.classSectionId;

    if (dto.questions) {
      await this.prisma.question.deleteMany({ where: { examId: id } });
      updateData.totalMarks = dto.questions.reduce((s: number, q: any) => s + (Number(q.marks) || 10), 0);
      updateData.questions = {
        create: dto.questions.map((q: any) => ({
          id: crypto.randomUUID(),
          text: q.questionText || q.text || '',
          options: {
            create: (q.options || []).map((opt: any) => ({
              id: crypto.randomUUID(),
              optionText: opt.optionText || opt.text || '',
              isCorrect: Boolean(opt.isCorrect),
            })),
          },
        })),
      };
    } else if (dto.totalMarks) {
      updateData.totalMarks = Number(dto.totalMarks);
    }

    return this.prisma.examination.update({
      where: { id },
      data: updateData,
      include: { questions: { include: { options: true } } },
    });
  }

  async getDrafts(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.DRAFT, teacherId: teacher.id },
      include: { Subject: true, Class: true, ClassSection: true, questions: { include: { options: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteDraft(id: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const draft = await this.prisma.examination.findFirst({
      where: { id, teacherId: teacher?.id, status: ExamStatus.DRAFT },
      select: { id: true },
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return this.prisma.examination.delete({ where: { id: draft.id } });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN REVIEW WORKFLOW
  // ─────────────────────────────────────────────────────────────────────────────

  async findApprovedExaminations() {
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.APPROVED },
      include: {
        Subject: { select: { id: true, name: true } },
        Teacher: { select: { firstName: true, lastName: true } },
        Class: { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  async findPendingExaminations() {
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.PENDING },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        Teacher: {
          select: {
            firstName: true,
            lastName: true,
            staffId: true,
            User: { select: { email: true, avatarUrl: true } },
          },
        },
        Class: { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
        questions: { include: { options: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin reviews an exam: APPROVED releases it to the teacher;
   * REJECTED stores feedback in the instructions field so the teacher
   * can see exactly what needs correcting.
   */
  async reviewExam(id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const exam = await this.prisma.examination.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Examination not found');
    if (exam.status !== ExamStatus.PENDING) {
      throw new BadRequestException('Only PENDING exams can be reviewed');
    }

    const instructionsUpdate =
      status === 'REJECTED' && rejectionReason?.trim()
        ? `[REJECTION_REASON]: ${rejectionReason.trim()}`
        : undefined;

    return this.prisma.examination.update({
      where: { id },
      data: {
        status: status as ExamStatus,
        ...(instructionsUpdate !== undefined ? { instructions: instructionsUpdate } : {}),
      },
      include: {
        Subject: { select: { id: true, name: true } },
        Teacher: { select: { firstName: true, lastName: true } },
        Class: { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER: APPROVED EXAMS DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns the calling teacher's APPROVED exams with question previews so the
   * teacher dashboard can display them immediately after admin approval.
   */
  async findApprovedForTeacher(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    return this.prisma.examination.findMany({
      where: { teacherId: teacher.id, status: ExamStatus.APPROVED },
      include: {
        Subject: { select: { id: true, name: true } },
        Class: { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
        questions: { select: { id: true, text: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEDULED DELIVERY WINDOW
  // windowStart / windowEnd / delayMinutes are stored in the DB via raw SQL
  // migration but are NOT yet in the generated Prisma client.  Every call in
  // this section uses (this.prisma as any) to bypass the missing type defs.
  // ─────────────────────────────────────────────────────────────────────────────

  async scheduleWindow(examId: string, dto: { windowStart: string; windowEnd: string }, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const exam = await this.prisma.examination.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Examination not found');
    if (exam.teacherId !== teacher.id) throw new ForbiddenException('You do not own this examination');
    if (exam.status !== ExamStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED exams can be scheduled for delivery');
    }

    const start = new Date(dto.windowStart);
    const end = new Date(dto.windowEnd);
    if (end <= start) throw new BadRequestException('windowEnd must be after windowStart');

    return (this.prisma as any).examination.update({
      where: { id: examId },
      data: { windowStart: start, windowEnd: end, updatedAt: new Date() },
      select: { id: true, title: true, windowStart: true, windowEnd: true, delayMinutes: true },
    });
  }

  async delayExam(examId: string, dto: { minutes: number }, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const exam: any = await (this.prisma as any).examination.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Examination not found');
    if (exam.teacherId !== teacher.id) throw new ForbiddenException('You do not own this examination');
    if (exam.status !== ExamStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED exams can be delayed');
    }

    const mins = Number(dto.minutes);
    if (!mins || mins < 1 || mins > 120) {
      throw new BadRequestException('Delay must be between 1 and 120 minutes');
    }

    const shiftMs = mins * 60 * 1000;
    const newStart = exam.windowStart ? new Date(new Date(exam.windowStart).getTime() + shiftMs) : null;
    const newEnd   = exam.windowEnd   ? new Date(new Date(exam.windowEnd).getTime()   + shiftMs) : null;

    return (this.prisma as any).examination.update({
      where: { id: examId },
      data: {
        ...(newStart ? { windowStart: newStart } : {}),
        ...(newEnd   ? { windowEnd:   newEnd   } : {}),
        delayMinutes: (exam.delayMinutes ?? 0) + mins,
        updatedAt: new Date(),
      },
      select: { id: true, title: true, windowStart: true, windowEnd: true, delayMinutes: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT EXAM LISTING
  // ─────────────────────────────────────────────────────────────────────────────

  async getStudentAvailableExams(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, classSectionId: true },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const exams: any[] = await (this.prisma as any).examination.findMany({
      where: { classSectionId: student.classSectionId ?? undefined, status: ExamStatus.APPROVED },
      select: {
        id: true,
        title: true,
        duration: true,
        totalMarks: true,
        examDate: true,
        windowStart: true,
        windowEnd: true,
        delayMinutes: true,
        Subject: { select: { id: true, name: true } },
        questions: { select: { id: true } },
        sessions: {
          where: { studentId: student.id },
          select: { id: true, status: true, timeRemainingSeconds: true, startedAt: true },
        },
      },
      orderBy: { examDate: 'asc' },
    });

    const now = new Date();
    return exams.map((exam: any) => {
      const session = exam.sessions?.[0] ?? null;
      let windowStatus: 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'NO_WINDOW' = 'NO_WINDOW';
      if (exam.windowStart && exam.windowEnd) {
        if (now < new Date(exam.windowStart)) windowStatus = 'SCHEDULED';
        else if (now > new Date(exam.windowEnd)) windowStatus = 'CLOSED';
        else windowStatus = 'OPEN';
      }
      return {
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        examDate: exam.examDate,
        windowStart: exam.windowStart,
        windowEnd: exam.windowEnd,
        delayMinutes: exam.delayMinutes ?? 0,
        windowStatus,
        subject: exam.Subject,
        questionCount: exam.questions?.length ?? 0,
        session: session
          ? { id: session.id, status: session.status, timeRemainingSeconds: session.timeRemainingSeconds, startedAt: session.startedAt }
          : null,
        serverNow: now.toISOString(),
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ExamSession rows live in the DB via raw SQL migration; all access via (any).
  // ─────────────────────────────────────────────────────────────────────────────

  async startSession(examId: string, userId: string, deviceFingerprint?: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, classSectionId: true },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const exam: any = await (this.prisma as any).examination.findUnique({
      where: { id: examId },
      include: { questions: { include: { options: true } } },
    });
    if (!exam) throw new NotFoundException('Examination not found');
    if (exam.status !== ExamStatus.APPROVED) throw new BadRequestException('This exam is not available');
    if (exam.classSectionId !== student.classSectionId) {
      throw new ForbiddenException('This exam is not assigned to your class');
    }

    const now = new Date();
    if (exam.windowStart && now < new Date(exam.windowStart)) {
      throw new BadRequestException(
        `Exam has not started yet. It opens at ${new Date(exam.windowStart).toISOString()}.`,
      );
    }
    if (exam.windowEnd && now > new Date(exam.windowEnd)) {
      throw new BadRequestException('The exam window has closed. Contact your teacher.');
    }

    const existing: any = await (this.prisma as any).examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });

    if (existing) {
      if (existing.status === 'COMPLETED' || existing.status === 'TIMED_OUT') {
        throw new BadRequestException('You have already completed this exam.');
      }
      if (existing.status === 'AWAITING_RESUME') {
        throw new BadRequestException('Your session is paused. Wait for your teacher to approve resumption.');
      }
      const newToken = crypto.randomBytes(32).toString('hex');
      const updated: any = await (this.prisma as any).examSession.update({
        where: { id: existing.id },
        data: {
          sessionToken: newToken,
          status: 'ACTIVE',
          deviceFingerprint: deviceFingerprint ?? existing.deviceFingerprint,
          lastSavedAt: now,
          resumeApprovedAt: null,
        },
      });
      return {
        sessionToken: newToken,
        timeRemainingSeconds: updated.timeRemainingSeconds,
        resumedAt: now.toISOString(),
        answers: JSON.parse(updated.answersJson || '{}'),
        questions: this.scrubCorrectAnswers(exam.questions),
        serverNow: now.toISOString(),
      };
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session: any = await (this.prisma as any).examSession.create({
      data: {
        examinationId: examId,
        studentId: student.id,
        sessionToken,
        status: 'ACTIVE',
        timeRemainingSeconds: exam.duration * 60,
        answersJson: '{}',
        deviceFingerprint: deviceFingerprint ?? null,
      },
    });

    return {
      sessionToken,
      timeRemainingSeconds: session.timeRemainingSeconds,
      resumedAt: null,
      answers: {},
      questions: this.scrubCorrectAnswers(exam.questions),
      serverNow: now.toISOString(),
    };
  }

  async saveProgress(
    examId: string,
    userId: string,
    dto: { sessionToken: string; answers: Record<string, string>; timeRemainingSeconds: number },
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session: any = await (this.prisma as any).examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session) throw new NotFoundException('No active session found');
    if (session.sessionToken !== dto.sessionToken) {
      throw new ForbiddenException('Invalid session token');
    }
    if (session.status === 'COMPLETED' || session.status === 'TIMED_OUT') {
      throw new BadRequestException('Session already ended');
    }

    await (this.prisma as any).examSession.update({
      where: { id: session.id },
      data: {
        answersJson: JSON.stringify(dto.answers),
        timeRemainingSeconds: Math.max(0, dto.timeRemainingSeconds),
        lastSavedAt: new Date(),
        status: 'ACTIVE',
      },
    });
    return { saved: true };
  }

  async submitSession(
    examId: string,
    userId: string,
    dto: { sessionToken: string; answers: Record<string, string> },
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session: any = await (this.prisma as any).examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session) throw new NotFoundException('No active session found');
    if (session.sessionToken !== dto.sessionToken) throw new ForbiddenException('Invalid session token');
    if (session.status === 'COMPLETED' || session.status === 'TIMED_OUT') {
      throw new BadRequestException('Session already ended');
    }

    const gradingResult = await this.submitAndAutoGrade({
      examinationId: examId,
      answers: Object.entries(dto.answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    });

    await (this.prisma as any).examSession.update({
      where: { id: session.id },
      data: {
        answersJson: JSON.stringify(dto.answers),
        timeRemainingSeconds: 0,
        status: 'COMPLETED',
        completedAt: new Date(),
        lastSavedAt: new Date(),
      },
    });

    return { ...gradingResult, sessionStatus: 'COMPLETED' };
  }

  async reportInterruption(examId: string, userId: string, dto: { sessionToken: string }) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session: any = await (this.prisma as any).examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session || session.sessionToken !== dto.sessionToken) {
      throw new ForbiddenException('Invalid session');
    }
    if (session.status !== 'ACTIVE' && session.status !== 'INTERRUPTED') {
      return { status: session.status };
    }

    await (this.prisma as any).examSession.update({
      where: { id: session.id },
      data: { status: 'AWAITING_RESUME' },
    });
    return { status: 'AWAITING_RESUME' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER: SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getInterruptedSessions(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const sessions: any[] = await (this.prisma as any).examSession.findMany({
      where: { status: 'AWAITING_RESUME', Examination: { teacherId: teacher.id } },
      include: { Examination: { select: { id: true, title: true, duration: true } } },
      orderBy: { lastSavedAt: 'asc' },
    });

    return Promise.all(
      sessions.map(async (s: any) => {
        const student = await this.prisma.student.findUnique({
          where: { id: s.studentId },
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        });
        const questionCount = await this.prisma.question.count({ where: { examId: s.examinationId } });
        return {
          sessionId: s.id,
          examId: s.examinationId,
          examTitle: s.Examination.title,
          studentId: s.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          admissionNo: student?.admissionNo ?? '—',
          timeRemainingSeconds: s.timeRemainingSeconds,
          interruptedAt: s.lastSavedAt,
          answeredCount: Object.keys(JSON.parse(s.answersJson || '{}')).length,
          totalQuestions: questionCount,
        };
      }),
    );
  }

  async approveResume(sessionId: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const session: any = await (this.prisma as any).examSession.findUnique({
      where: { id: sessionId },
      include: { Examination: { select: { teacherId: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.Examination.teacherId !== teacher.id) {
      throw new ForbiddenException('You do not own the examination for this session');
    }
    if (session.status !== 'AWAITING_RESUME') {
      throw new BadRequestException(`Session is already ${session.status}`);
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const updated: any = await (this.prisma as any).examSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        sessionToken: newToken,
        resumeApprovedAt: new Date(),
        resumeApprovedById: userId,
      },
    });

    return {
      approved: true,
      sessionId: updated.id,
      newSessionToken: newToken,
      timeRemainingSeconds: updated.timeRemainingSeconds,
    };
  }

  async pollResumeStatus(examId: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session: any = await (this.prisma as any).examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session) throw new NotFoundException('No session found for this exam');

    if (session.status === 'ACTIVE' && session.resumeApprovedAt) {
      return {
        status: 'APPROVED',
        sessionToken: session.sessionToken,
        timeRemainingSeconds: session.timeRemainingSeconds,
        answers: JSON.parse(session.answersJson || '{}'),
      };
    }
    return { status: session.status };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-GRADE (legacy + session submit)
  // ─────────────────────────────────────────────────────────────────────────────

  async submitAndAutoGrade(dto: {
    examinationId: string;
    studentId?: string;
    answers: Array<{ questionId: string; selectedOptionId: string }>;
  }) {
    const exam = await this.prisma.examination.findUnique({ where: { id: dto.examinationId } });
    if (!exam) throw new NotFoundException('Examination not found');

    const questions = await this.prisma.question.findMany({
      where: { examId: dto.examinationId },
      include: { options: true },
    });

    let earnedScore = 0;
    let totalPossibleMarks = 0;
    const gradedAnswers: any[] = [];
    const perQ = questions.length > 0 && exam.totalMarks > 0 ? exam.totalMarks / questions.length : 10;

    for (const question of questions) {
      const qMarks = (question as any).marks || perQ;
      totalPossibleMarks += qMarks;

      const correctOption = question.options.find((o: any) => o.isCorrect);
      const studentAnswer = (dto.answers || []).find((a) => a.questionId === question.id);
      const selectedOptionId = studentAnswer?.selectedOptionId ?? '';
      const isCorrect = correctOption ? correctOption.id === selectedOptionId : false;

      if (isCorrect) earnedScore += qMarks;

      gradedAnswers.push({
        questionId: question.id,
        questionText: question.text,
        selectedOptionId,
        correctOptionId: correctOption?.id || '',
        isCorrect,
        marksAwarded: isCorrect ? qMarks : 0,
        options: question.options,
      });
    }

    return {
      success: true,
      score: earnedScore,
      totalMarks: totalPossibleMarks,
      percentage: totalPossibleMarks > 0 ? Math.round((earnedScore / totalPossibleMarks) * 100) : 0,
      breakdown: gradedAnswers,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Strip isCorrect flags before sending questions to students. */
  private scrubCorrectAnswers(questions: any[]) {
    return questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o: any) => ({ id: o.id, optionText: o.optionText })),
    }));
  }
}

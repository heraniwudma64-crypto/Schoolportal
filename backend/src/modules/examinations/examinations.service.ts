import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ExamStatus, ExamSessionStatus } from '@prisma/client';
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
              dto.status === 'DRAFT'    ? ExamStatus.DRAFT    :
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
    if (dto.subjectId)      updateData.subjectId      = dto.subjectId;
    if (dto.classId)        updateData.classId        = dto.classId;
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
        Subject:      { select: { id: true, name: true } },
        Teacher:      { select: { firstName: true, lastName: true } },
        Class:        { select: { id: true, name: true } },
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
        Class:        { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
        questions:    { include: { options: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

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
        Subject:      { select: { id: true, name: true } },
        Teacher:      { select: { firstName: true, lastName: true } },
        Class:        { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER: APPROVED / PUBLISHED EXAM DASHBOARDS
  // ─────────────────────────────────────────────────────────────────────────────

  async findApprovedForTeacher(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    return this.prisma.examination.findMany({
      where: { teacherId: teacher.id, status: ExamStatus.APPROVED },
      include: {
        Subject:      { select: { id: true, name: true } },
        Class:        { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
        questions:    { select: { id: true, text: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findPublishedForTeacher(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const exams = await this.prisma.examination.findMany({
      where: { teacherId: teacher.id, status: ExamStatus.PUBLISHED },
      include: {
        Subject:      { select: { id: true, name: true } },
        ClassSection: { select: { id: true, name: true } },
        questions:    { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const now = new Date();
    return exams.map((e) => {
      let windowStatus: 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'NO_WINDOW' = 'NO_WINDOW';
      if (e.windowStart && e.windowEnd) {
        if (now < e.windowStart) windowStatus = 'SCHEDULED';
        else if (now > e.windowEnd) windowStatus = 'CLOSED';
        else windowStatus = 'OPEN';
      }
      return {
        id:            e.id,
        title:         e.title,
        duration:      e.duration,
        totalMarks:    e.totalMarks,
        status:        e.status,
        Subject:       e.Subject,
        ClassSection:  e.ClassSection,
        questionCount: e.questions?.length ?? 0,
        windowStart:   e.windowStart?.toISOString() ?? null,
        windowEnd:     e.windowEnd?.toISOString()   ?? null,
        delayMinutes:  e.delayMinutes ?? 0,
        windowStatus,
        updatedAt:     e.updatedAt,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER: PUBLISH EXAM TO STUDENTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Atomically moves an APPROVED exam to PUBLISHED and stamps the delivery
   * window so students can immediately see it on their dashboards.
   *
   * Guards:
   *  1. Caller must be the owning teacher.
   *  2. Exam must be APPROVED (not DRAFT / PENDING / REJECTED / already PUBLISHED).
   *  3. windowEnd must be after windowStart.
   *  4. Window cannot be more than 30 days in the future.
   *
   * Note: we do NOT reject start times close to or slightly before "now" because
   * the client sends a local-time value that may differ from the server clock by
   * several minutes depending on the teacher's timezone.  A 10-minute grace
   * window prevents false "in the past" rejections while still blocking clearly
   * stale dates.
   */
  async publishExam(
    examId: string,
    dto: { windowStart: string; windowEnd: string },
    userId: string,
  ) {
    // ── 1. Resolve teacher ───────────────────────────────────────────────────
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    // ── 2. Resolve exam ──────────────────────────────────────────────────────
    const exam = await this.prisma.examination.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException(`Examination with id "${examId}" not found`);
    if (exam.teacherId !== teacher.id) {
      throw new ForbiddenException('You do not own this examination');
    }

    if (exam.status === ExamStatus.PUBLISHED) {
      throw new BadRequestException(
        'This exam is already published. Use the delay endpoint to push the window back, or contact admin to retract.',
      );
    }
    if (exam.status !== ExamStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot publish an exam with status "${exam.status}". Only APPROVED exams can be published. ` +
        'Submit the exam for admin review first.',
      );
    }

    // ── 3. Parse and validate dates ──────────────────────────────────────────
    if (!dto.windowStart || !dto.windowEnd) {
      throw new BadRequestException('Both windowStart and windowEnd are required');
    }

    const start = new Date(dto.windowStart);
    const end   = new Date(dto.windowEnd);

    if (isNaN(start.getTime())) {
      throw new BadRequestException(
        `Invalid windowStart value: "${dto.windowStart}". Expected an ISO 8601 date string.`,
      );
    }
    if (isNaN(end.getTime())) {
      throw new BadRequestException(
        `Invalid windowEnd value: "${dto.windowEnd}". Expected an ISO 8601 date string.`,
      );
    }
    if (end <= start) {
      throw new BadRequestException(
        `windowEnd (${end.toISOString()}) must be after windowStart (${start.toISOString()})`,
      );
    }

    const now           = new Date();
    const maxFutureMs   = 30 * 24 * 60 * 60 * 1000;
    // 10-minute grace covers teacher timezone offset + network latency
    const gracePastMs   = 10 * 60 * 1000;

    if (start < new Date(now.getTime() - gracePastMs)) {
      throw new BadRequestException(
        'windowStart is too far in the past. Please choose a start time within the next 30 days.',
      );
    }
    if (start.getTime() - now.getTime() > maxFutureMs) {
      throw new BadRequestException('windowStart cannot be more than 30 days in the future');
    }

    // ── 4. Persist atomically ────────────────────────────────────────────────
    try {
      const updated = await this.prisma.examination.update({
        where: { id: examId },
        data: {
          status:       ExamStatus.PUBLISHED,
          windowStart:  start,
          windowEnd:    end,
          delayMinutes: 0,
          updatedAt:    now,
        },
        include: {
          Subject:      { select: { id: true, name: true } },
          ClassSection: { select: { id: true, name: true } },
          questions:    { select: { id: true } },
        },
      });

      return {
        id:            updated.id,
        title:         updated.title,
        status:        updated.status,
        windowStart:   updated.windowStart?.toISOString() ?? null,
        windowEnd:     updated.windowEnd?.toISOString()   ?? null,
        delayMinutes:  updated.delayMinutes,
        subject:       updated.Subject,
        classSection:  updated.ClassSection,
        questionCount: updated.questions?.length ?? 0,
        publishedAt:   now.toISOString(),
        message:
          `Exam "${updated.title}" has been published. ` +
          `Students can start from ${start.toLocaleString()} until ${end.toLocaleString()}.`,
      };
    } catch (error: any) {
      // Prisma errors (unique violations, DB unavailable, etc.) surface here
      // with a descriptive message instead of a raw 500.
      if (error.code === 'P2025') {
        throw new NotFoundException(`Examination "${examId}" was not found or was deleted`);
      }
      throw new InternalServerErrorException(
        `Failed to publish examination: ${error.message ?? 'Unknown database error'}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEDULED DELIVERY WINDOW
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
    const end   = new Date(dto.windowEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for windowStart or windowEnd');
    }
    if (end <= start) throw new BadRequestException('windowEnd must be after windowStart');

    return this.prisma.examination.update({
      where: { id: examId },
      data:  { windowStart: start, windowEnd: end, updatedAt: new Date() },
      select: { id: true, title: true, windowStart: true, windowEnd: true, delayMinutes: true },
    });
  }

  async delayExam(examId: string, dto: { minutes: number }, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const exam = await this.prisma.examination.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Examination not found');
    if (exam.teacherId !== teacher.id) throw new ForbiddenException('You do not own this examination');

    // ── FIX: allow delaying both APPROVED and PUBLISHED exams ───────────────
    if (exam.status !== ExamStatus.APPROVED && exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException(
        `Cannot delay an exam with status "${exam.status}". Only APPROVED or PUBLISHED exams can be delayed.`,
      );
    }

    const mins = Number(dto.minutes);
    if (!mins || mins < 1 || mins > 120) {
      throw new BadRequestException('Delay must be between 1 and 120 minutes');
    }

    const shiftMs  = mins * 60 * 1000;
    const newStart = exam.windowStart ? new Date(exam.windowStart.getTime() + shiftMs) : null;
    const newEnd   = exam.windowEnd   ? new Date(exam.windowEnd.getTime()   + shiftMs) : null;

    return this.prisma.examination.update({
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
      select: {
        id: true,
        classSectionId: true,
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          select: { classSectionId: true },
        },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const effectiveSectionId = student.StudentEnrollment[0]?.classSectionId || student.classSectionId;
    if (!effectiveSectionId) {
      return [];
    }

    const exams = await this.prisma.examination.findMany({
      where: {
        classSectionId: effectiveSectionId,
        status:         ExamStatus.PUBLISHED,
      },
      select: {
        id: true, title: true, duration: true, totalMarks: true, examDate: true,
        windowStart: true, windowEnd: true, delayMinutes: true,
        Subject:   { select: { id: true, name: true } },
        questions: { select: { id: true } },
        sessions: {
          where:  { studentId: student.id },
          select: { id: true, status: true, timeRemainingSeconds: true, startedAt: true },
        },
      },
      orderBy: { examDate: 'asc' },
    });

    const now = new Date();
    return exams.map((exam) => {
      const session = (exam.sessions as any[])?.[0] ?? null;
      let windowStatus: 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'NO_WINDOW' = 'NO_WINDOW';
      if (exam.windowStart && exam.windowEnd) {
        if (now < exam.windowStart) windowStatus = 'SCHEDULED';
        else if (now > exam.windowEnd) windowStatus = 'CLOSED';
        else windowStatus = 'OPEN';
      }
      return {
        id:            exam.id,
        title:         exam.title,
        duration:      exam.duration,
        totalMarks:    exam.totalMarks,
        examDate:      exam.examDate,
        windowStart:   exam.windowStart?.toISOString() ?? null,
        windowEnd:     exam.windowEnd?.toISOString()   ?? null,
        delayMinutes:  exam.delayMinutes ?? 0,
        windowStatus,
        subject:       exam.Subject,
        questionCount: exam.questions?.length ?? 0,
        session: session
          ? {
              id:                   session.id,
              status:               session.status,
              timeRemainingSeconds: session.timeRemainingSeconds,
              startedAt:            session.startedAt,
            }
          : null,
        serverNow: now.toISOString(),
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async startSession(examId: string, userId: string, deviceFingerprint?: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        classSectionId: true,
        StudentEnrollment: {
          where: { status: 'ACTIVE' },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          select: { classSectionId: true },
        },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const effectiveSectionId = student.StudentEnrollment[0]?.classSectionId || student.classSectionId;

    const exam = await this.prisma.examination.findUnique({
      where: { id: examId },
      include: { questions: { include: { options: true } } },
    });
    if (!exam) throw new NotFoundException('Examination not found');

    if (exam.status !== ExamStatus.APPROVED && exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException('This exam is not available');
    }
    if (exam.classSectionId !== effectiveSectionId) {
      throw new ForbiddenException('This exam is not assigned to your class');
    }

    const now = new Date();
    if (exam.windowStart && now < exam.windowStart) {
      throw new BadRequestException(
        `Exam has not started yet. It opens at ${exam.windowStart.toISOString()}.`,
      );
    }
    if (exam.windowEnd && now > exam.windowEnd) {
      throw new BadRequestException('The exam window has closed. Contact your teacher.');
    }

    const existing = await this.prisma.examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });

    if (existing) {
      if (existing.status === ExamSessionStatus.COMPLETED || existing.status === ExamSessionStatus.TIMED_OUT) {
        throw new BadRequestException('You have already completed this exam.');
      }
      if (existing.status === ExamSessionStatus.AWAITING_RESUME) {
        throw new BadRequestException('Your session is paused. Wait for your teacher to approve resumption.');
      }
      // ACTIVE or INTERRUPTED — re-issue token, restore state
      const newToken = crypto.randomBytes(32).toString('hex');
      const updated = await this.prisma.examSession.update({
        where: { id: existing.id },
        data: {
          sessionToken:      newToken,
          status:            ExamSessionStatus.ACTIVE,
          deviceFingerprint: deviceFingerprint ?? existing.deviceFingerprint,
          lastSavedAt:       now,
          resumeApprovedAt:  null,
        },
      });
      return {
        sessionToken:         newToken,
        timeRemainingSeconds: updated.timeRemainingSeconds,
        resumedAt:            now.toISOString(),
        answers:              JSON.parse(updated.answersJson || '{}'),
        questions:            this.scrubCorrectAnswers(exam.questions),
        serverNow:            now.toISOString(),
      };
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = await this.prisma.examSession.create({
      data: {
        examinationId:        examId,
        studentId:            student.id,
        sessionToken,
        status:               ExamSessionStatus.ACTIVE,
        timeRemainingSeconds: exam.duration * 60,
        answersJson:          '{}',
        deviceFingerprint:    deviceFingerprint ?? null,
      },
    });

    return {
      sessionToken,
      timeRemainingSeconds: session.timeRemainingSeconds,
      resumedAt:            null,
      answers:              {},
      questions:            this.scrubCorrectAnswers(exam.questions),
      serverNow:            now.toISOString(),
    };
  }

  async saveProgress(
    examId: string,
    userId: string,
    dto: { sessionToken: string; answers: Record<string, string>; timeRemainingSeconds: number },
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session = await this.prisma.examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session) throw new NotFoundException('No active session found');
    if (session.sessionToken !== dto.sessionToken) {
      throw new ForbiddenException('Invalid session token');
    }
    if (session.status === ExamSessionStatus.COMPLETED || session.status === ExamSessionStatus.TIMED_OUT) {
      throw new BadRequestException('Session already ended');
    }

    await this.prisma.examSession.update({
      where: { id: session.id },
      data: {
        answersJson:          JSON.stringify(dto.answers),
        timeRemainingSeconds: Math.max(0, dto.timeRemainingSeconds),
        lastSavedAt:          new Date(),
        status:               ExamSessionStatus.ACTIVE,
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

    const session = await this.prisma.examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session) throw new NotFoundException('No active session found');
    if (session.sessionToken !== dto.sessionToken) throw new ForbiddenException('Invalid session token');
    if (session.status === ExamSessionStatus.COMPLETED || session.status === ExamSessionStatus.TIMED_OUT) {
      throw new BadRequestException('Session already ended');
    }

    const gradingResult = await this.submitAndAutoGrade({
      examinationId: examId,
      answers: Object.entries(dto.answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    });

    await this.prisma.examSession.update({
      where: { id: session.id },
      data: {
        answersJson:          JSON.stringify(dto.answers),
        timeRemainingSeconds: 0,
        status:               ExamSessionStatus.COMPLETED,
        completedAt:          new Date(),
        lastSavedAt:          new Date(),
      },
    });

    return { ...gradingResult, sessionStatus: 'COMPLETED' };
  }

  async reportInterruption(examId: string, userId: string, dto: { sessionToken: string }) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session = await this.prisma.examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session || session.sessionToken !== dto.sessionToken) {
      throw new ForbiddenException('Invalid session');
    }
    if (session.status !== ExamSessionStatus.ACTIVE && session.status !== ExamSessionStatus.INTERRUPTED) {
      return { status: session.status };
    }

    await this.prisma.examSession.update({
      where: { id: session.id },
      data: { status: ExamSessionStatus.AWAITING_RESUME },
    });
    return { status: 'AWAITING_RESUME' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHER: SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getInterruptedSessions(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const sessions = await this.prisma.examSession.findMany({
      where: {
        status:      ExamSessionStatus.AWAITING_RESUME,
        Examination: { teacherId: teacher.id },
      },
      include: { Examination: { select: { id: true, title: true, duration: true } } },
      orderBy: { lastSavedAt: 'asc' },
    });

    return Promise.all(
      sessions.map(async (s) => {
        const student = await this.prisma.student.findUnique({
          where:  { id: s.studentId },
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        });
        const questionCount = await this.prisma.question.count({ where: { examId: s.examinationId } });
        return {
          sessionId:            s.id,
          examId:               s.examinationId,
          examTitle:            s.Examination.title,
          studentId:            s.studentId,
          studentName:          student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          admissionNo:          student?.admissionNo ?? '—',
          timeRemainingSeconds: s.timeRemainingSeconds,
          interruptedAt:        s.lastSavedAt,
          answeredCount:        Object.keys(JSON.parse(s.answersJson || '{}')).length,
          totalQuestions:       questionCount,
        };
      }),
    );
  }

  async approveResume(sessionId: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const session = await this.prisma.examSession.findUnique({
      where:   { id: sessionId },
      include: { Examination: { select: { teacherId: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.Examination.teacherId !== teacher.id) {
      throw new ForbiddenException('You do not own the examination for this session');
    }
    if (session.status !== ExamSessionStatus.AWAITING_RESUME) {
      throw new BadRequestException(`Session is already ${session.status}`);
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const updated = await this.prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status:              ExamSessionStatus.ACTIVE,
        sessionToken:        newToken,
        resumeApprovedAt:    new Date(),
        resumeApprovedById:  userId,
      },
    });

    return {
      approved:             true,
      sessionId:            updated.id,
      newSessionToken:      newToken,
      timeRemainingSeconds: updated.timeRemainingSeconds,
    };
  }

  async pollResumeStatus(examId: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student profile not found');

    const session = await this.prisma.examSession.findUnique({
      where: { examinationId_studentId: { examinationId: examId, studentId: student.id } },
    });
    if (!session) throw new NotFoundException('No session found for this exam');

    if (session.status === ExamSessionStatus.ACTIVE && session.resumeApprovedAt) {
      return {
        status:               'APPROVED',
        sessionToken:         session.sessionToken,
        timeRemainingSeconds: session.timeRemainingSeconds,
        answers:              JSON.parse(session.answersJson || '{}'),
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

    let earnedScore       = 0;
    let totalPossibleMarks = 0;
    const gradedAnswers: any[] = [];
    const perQ = questions.length > 0 && exam.totalMarks > 0 ? exam.totalMarks / questions.length : 10;

    for (const question of questions) {
      const qMarks = (question as any).marks || perQ;
      totalPossibleMarks += qMarks;

      const correctOption  = question.options.find((o: any) => o.isCorrect);
      const studentAnswer  = (dto.answers || []).find((a) => a.questionId === question.id);
      const selectedOptionId = studentAnswer?.selectedOptionId ?? '';
      const isCorrect      = correctOption ? correctOption.id === selectedOptionId : false;

      if (isCorrect) earnedScore += qMarks;

      gradedAnswers.push({
        questionId:      question.id,
        questionText:    question.text,
        selectedOptionId,
        correctOptionId: correctOption?.id || '',
        isCorrect,
        marksAwarded:    isCorrect ? qMarks : 0,
        options:         question.options,
      });
    }

    return {
      success:    true,
      score:      earnedScore,
      totalMarks: totalPossibleMarks,
      percentage: totalPossibleMarks > 0 ? Math.round((earnedScore / totalPossibleMarks) * 100) : 0,
      breakdown:  gradedAnswers,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private scrubCorrectAnswers(questions: any[]) {
    return questions.map((q) => ({
      id:      q.id,
      text:    q.text,
      options: q.options.map((o: any) => ({ id: o.id, optionText: o.optionText })),
    }));
  }
}

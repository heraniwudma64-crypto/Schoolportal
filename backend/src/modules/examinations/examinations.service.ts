import { 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException, 
  UnauthorizedException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { ExamStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFormData() {
    const subjects = await this.prisma.subject.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
    });

    const classes = await this.prisma.class.findMany({
      select: { id: true, name: true, section: true },
    });

    const sections = await this.prisma.classSection.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    return { subjects, classes, sections };
  }

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

  async findTeacherExaminations(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw new UnauthorizedException('Active user is not registered as a teacher');
    }

    return this.prisma.examination.findMany({
      where: { teacherId: teacher.id },
      include: {
        Subject: true,
        Class: true,
        ClassSection: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExamination(dto: any, userId?: string) {
    let teacherId: string | undefined;

    if (userId) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
      if (teacher) {
        teacherId = teacher.id;
      }
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

    const calculatedTotalMarks = dto.questions && dto.questions.length > 0
      ? dto.questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 10), 0)
      : (dto.totalMarks || 100);

    const examId = crypto.randomUUID();
    const now = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        return tx.examination.create({
          data: {
            id: examId,
            title: dto.title || 'Untitled Examination',
            subjectId: subjectId,
            classId,
            classSectionId: dto.classSectionId,
            ...(teacherId ? { teacherId } : {}),
            duration: Number(dto.duration) || 60,
            status: dto.status === 'DRAFT' 
              ? ExamStatus.DRAFT 
              : dto.status === 'APPROVED' 
              ? ExamStatus.APPROVED 
              : ExamStatus.PENDING,
            totalMarks: calculatedTotalMarks,
            examDate: dto.examDate ? new Date(dto.examDate) : now,
            updatedAt: now,
            questions: {
              create: (dto.questions || []).map((q: any) => ({
                id: crypto.randomUUID(),
                text: q.questionText || q.text || '',
                marks: Number(q.marks) || 10,
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
          include: {
            questions: {
              include: { options: true },
            },
          },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to create examination: ${error.message}`);
    }
  }

  async updateExamination(id: string, dto: any, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const existing = await this.prisma.examination.findUnique({ where: { id } });
    if (!teacher || !existing || existing.teacherId !== teacher.id) throw new UnauthorizedException('You cannot edit this examination');
    if (dto.subjectId || dto.classSectionId) {
      const subjectId = dto.subjectId || existing.subjectId;
      const classSectionId = dto.classSectionId || existing.classSectionId;
      const assignment = await this.prisma.sectionSubjectTeacher.findFirst({ where: { teacherId: teacher.id, subjectId, classSectionId } });
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
      await this.prisma.question.deleteMany({
        where: { examId: id },
      });

      updateData.questions = {
        create: dto.questions.map((q: any) => ({
          id: crypto.randomUUID(),
          text: q.questionText || q.text || '',
          marks: Number(q.marks) || 10,
          options: {
            create: (q.options || []).map((opt: any) => ({
              id: crypto.randomUUID(),
              optionText: opt.optionText || opt.text || '',
              isCorrect: Boolean(opt.isCorrect),
            })),
          },
        })),
      };
    }

    return this.prisma.examination.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
  }

  async getDrafts(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.DRAFT, teacherId: teacher.id },
      include: {
        Subject: true,
        Class: true,
        ClassSection: true,
        questions: {
          include: { options: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteDraft(id: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const draft = await this.prisma.examination.findFirst({ where: { id, teacherId: teacher?.id, status: ExamStatus.DRAFT }, select: { id: true } });
    if (!draft) throw new NotFoundException('Draft not found');
    return this.prisma.examination.delete({ where: { id: draft.id } });
  }

  async findDraftExaminations() {
    return this.prisma.examination.findMany({ where: { status: ExamStatus.DRAFT } });
  }

  async findApprovedExaminations() {
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.APPROVED },
      include: { Subject: true, Teacher: { include: { User: true } } },
    });
  }

  async findPendingExaminations() {
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.PENDING },
      include: {
        Subject: true,
        Teacher: { include: { User: true } },
        Class: true,
        ClassSection: true,
        questions: { include: { options: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateExamStatus(id: string, status: string) {
    const exam = await this.prisma.examination.findUnique({ where: { id } });
    if (!exam) {
      throw new NotFoundException('Examination not found');
    }
    return this.prisma.examination.update({
      where: { id },
      data: { status: status as ExamStatus },
    });
  }

  async submitAndAutoGrade(dto: {
    examinationId: string;
    studentId?: string;
    answers: Array<{ questionId: string; selectedOptionId: string }>;
  }) {
    const exam = await this.prisma.examination.findUnique({
      where: { id: dto.examinationId },
    });

    if (!exam) {
      throw new NotFoundException('Examination not found');
    }

    const questions = await this.prisma.question.findMany({
      where: { examId: dto.examinationId },
      include: { options: true },
    });

    let earnedScore = 0;
    let totalPossibleMarks = 0;
    const gradedAnswers: any[] = [];

    for (const question of questions) {
      const questionMarks = (question as any).marks || 10;
      totalPossibleMarks += questionMarks;

      const correctOption = question.options.find((o: any) => o.isCorrect);
      const studentAnswer = (dto.answers || []).find((a) => a.questionId === question.id);
      const selectedOptionId = studentAnswer ? studentAnswer.selectedOptionId : '';

      const isCorrect = correctOption ? correctOption.id === selectedOptionId : false;

      if (isCorrect) {
        earnedScore += questionMarks;
      }

      gradedAnswers.push({
        questionId: question.id,
        questionText: question.text,
        selectedOptionId,
        correctOptionId: correctOption?.id || '',
        isCorrect,
        marksAwarded: isCorrect ? questionMarks : 0,
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
}

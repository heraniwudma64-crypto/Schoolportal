import { Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';
import { ExamStatus } from '@prisma/client';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFormData() {
    const subjects = await this.prisma.subject.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true }
    });
    
    const classes = await this.prisma.class.findMany({
      select: { id: true, name: true, section: true }
    });
    
    const sections = await this.prisma.classSection.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true }
    });

    return { subjects, classes, sections };
  }

  async findTeacherExaminations(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');
    
    return this.prisma.examination.findMany({
      where: { teacherId: teacher.id },
      include: {
        Subject: true,
        Class: true,
        ClassSection: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createExamination(dto: any, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw new UnauthorizedException('Active user is not registered as a teacher');
    }

    if (!dto.subjectId) throw new BadRequestException('Subject is required');
    if (!dto.classId) throw new BadRequestException('Class is required');
    if (!dto.classSectionId) throw new BadRequestException('Class Section is required');

    const calculatedTotalMarks = dto.questions 
      ? dto.questions.reduce((sum: number, q: any) => sum + (q.marks || 10), 0) 
      : 100;

    const examId = crypto.randomUUID();
    const now = new Date();

    try {
      const examination = await this.prisma.$transaction(async (tx) => {
        // Create Examination and questions/options atomically
        return tx.examination.create({
          data: {
            id: examId,
            title: dto.title || 'Untitled Examination',
            subjectId: dto.subjectId,
            classId: dto.classId,
            classSectionId: dto.classSectionId,
            teacherId: teacher.id,
            duration: dto.duration || 60,
            status: dto.status === 'DRAFT' ? ExamStatus.DRAFT : ExamStatus.PENDING,
            totalMarks: calculatedTotalMarks,
            examDate: now,
            updatedAt: now,
            questions: {
              create: (dto.questions || []).map((q: any) => ({
                id: crypto.randomUUID(),
                text: q.questionText,
                options: {
                  create: (q.options || []).map((opt: any) => ({
                    id: crypto.randomUUID(),
                    optionText: opt.optionText,
                    isCorrect: Boolean(opt.isCorrect),
                  }))
                }
              }))
            }
          },
        });
      });

      return examination;
    } catch (error: any) {
      require('fs').writeFileSync('/tmp/exam_error.log', error.stack || error.message);
      throw new InternalServerErrorException(`Failed to create examination: ${error.message}`);
    }
  }

  async findApprovedExaminations() {
    return this.prisma.examination.findMany({
      where: { status: ExamStatus.APPROVED },
      include: { Subject: true, Teacher: { include: { User: true } } }
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
        questions: { include: { options: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateExamStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const exam = await this.prisma.examination.findUnique({ where: { id } });
    if (!exam || exam.status !== ExamStatus.PENDING) {
      throw new BadRequestException('Only pending exams can be approved or rejected.');
    }
    return this.prisma.examination.update({
      where: { id },
      data: { status: status === 'APPROVED' ? ExamStatus.APPROVED : ExamStatus.REJECTED },
    });
  }

  async submitAndAutoGrade(dto: {
    examinationId: string;
    studentId: string;
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
      const questionMarks = 10;
      totalPossibleMarks += questionMarks;

      const correctOption = question.options.find((o: any) => o.isCorrect);
      const studentAnswer = dto.answers.find((a) => a.questionId === question.id);
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
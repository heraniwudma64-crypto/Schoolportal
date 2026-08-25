import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Create exam with status (DRAFT or PENDING)
 async createExamination(dto: any) {
    const calculatedTotalMarks = dto.questions 
      ? dto.questions.reduce((sum: number, q: any) => sum + (q.marks || 10), 0) 
      : 100;

    const examId = crypto.randomUUID();
    const now = new Date();

    // 1. Create the examination record
    const examination = await this.prisma.examination.create({
      data: {
        id: examId,
        title: dto.title,
        Subject: dto.subject,
        duration: dto.duration,
        status: dto.status || 'DRAFT',
        totalMarks: calculatedTotalMarks,
        examDate: now,
        updatedAt: now, // 👈 Fixes the missing updatedAt error
      } as any,
    });

    // 2. Safely create questions and options linked to this exam
    if (dto.questions && Array.isArray(dto.questions)) {
      for (const q of dto.questions) {
        const questionId = crypto.randomUUID();
        await (this.prisma as any).question.create({
          data: {
            id: questionId,
            examId: examId,
            questionText: q.questionText,
            marks: q.marks || 10,
            options: {
              create: q.options.map((opt: any) => ({
                id: crypto.randomUUID(),
                optionText: opt.optionText,
                isCorrect: Boolean(opt.isCorrect), // 👈 Respects whichever option (A, B, C, or D) is marked correct!
              })),
            },
          },
        });
      }
    }

    return examination;
  }
  
  // 2. Fetch only approved exams (for students)
  async findApprovedExaminations() {
    return (this.prisma as any).examination.findMany({
      where: { status: 'APPROVED' },
    });
  }

  // 3. Fetch pending exams (for admin review dashboard)
  async findPendingExaminations() {
    return (this.prisma as any).examination.findMany({
      where: { status: 'PENDING' },
    });
  }

  // 4. Update exam status (Approve or Reject)
  async updateExamStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    return (this.prisma as any).examination.update({
      where: { id },
      data: { status },
    });
  }

  // 5. Existing auto-grading submission logic
  async submitAndAutoGrade(dto: {
    examinationId: string;
    studentId: string;
    answers: Array<{ questionId: string; selectedOptionId: string }>;
  }) {
    const exam: any = await this.prisma.examination.findUnique({
      where: { id: dto.examinationId },
    });

    if (!exam) {
      throw new NotFoundException('Examination not found');
    }

    const questions: any[] = await (this.prisma as any).question.findMany({
      where: { examId: dto.examinationId },
      include: { options: true },
    });

    let earnedScore = 0;
    let totalPossibleMarks = 0;
    const gradedAnswers: any[] = [];

    for (const question of questions) {
      const questionMarks = question.marks || 10;
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
        questionText: question.questionText,
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
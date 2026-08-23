import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ExaminationsService {
  constructor(private prisma: PrismaService) {}

  async createExam(dto: { 
    title: string; 
    date: string; 
    classId: string; 
    subjectId: string; 
    teacherId: string 
  }) {
    return (this.prisma as any).examination.create({
      data: {
        title: dto.title,
        date: new Date(dto.date),
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
      },
    });
  }

  async getTeacherExams(teacherId: string) {
    return (this.prisma as any).examination.findMany({
      where: { teacherId },
      include: { 
        class: true, 
        subject: true 
      },
      orderBy: { date: 'desc' },
    });
  }
}
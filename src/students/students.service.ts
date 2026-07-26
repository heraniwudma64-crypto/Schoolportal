import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.student.findMany();
  }

  async create(student: any) {
    return await this.prisma.student.create({ data: student });
  }

  async getStudentProfile(userId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return {
      message: 'Welcome to your student profile',
      student,
    };
  }
}

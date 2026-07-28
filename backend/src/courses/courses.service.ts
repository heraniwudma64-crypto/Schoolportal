import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        teacher: {
          select: { id: true, loginId: true, email: true },
        },
      },
    });
  }

  async createCourse(title: string, description: string, teacherId: string) {
    return this.prisma.course.create({
      data: {
        title,
        description,
        teacherId,
      },
    });
  }
}
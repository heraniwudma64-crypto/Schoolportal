import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async getAllTeachers() {
    return this.prisma.teacher.findMany({
      include: {
        User: {
          select: { email: true }
        }
      },
      orderBy: { firstName: 'asc' }
    });
  }

  async getTeacherDashboardStats(teacherId: string) {
    const classesCount = await this.prisma.classTeacher.count({
      where: { teacherId },
    });
    
    const activeAssignments = await this.prisma.assignment.count({
      where: { teacherId },
    });

    return {
      classesCount,
      activeAssignments,
    };
  }

  async getAssignedClasses(teacherId: string) {
    return this.prisma.classTeacher.findMany({
      where: { teacherId },
      include: { class: true },
    });
  }
}
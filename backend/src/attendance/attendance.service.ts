import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(dto: { userId: string; courseId: string; status: any; date?: string }) {
    try {
      const attendanceDate = dto.date ? new Date(dto.date) : new Date();

      return await this.prisma.attendance.upsert({
        where: {
          userId_courseId_date: {
            userId: dto.userId,
            courseId: dto.courseId,
            date: attendanceDate,
          },
        },
        update: { status: dto.status },
        create: {
          userId: dto.userId,
          courseId: dto.courseId,
          status: dto.status,
          date: attendanceDate,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getCourseAttendance(courseId: string) {
    return this.prisma.attendance.findMany({
      where: { courseId },
      include: { user: true }, // <-- Fixed from student: true to user: true
      orderBy: { date: 'desc' },
    });
  }
}
import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enrollStudent(studentId: string, courseId: string) {
    try {
      // Check if already enrolled
      const existing = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId, courseId },
        },
      });

      if (existing) {
        throw new ConflictException('Student is already enrolled in this course');
      }

      return await this.prisma.enrollment.create({
        data: {
          studentId,
          courseId,
        },
      });
    } catch (error) {
      // This will force the error to print in your terminal!
      console.error('CRITICAL ENROLLMENT ERROR:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || 'Something went wrong');
    }
  }

  async getCourseStudents(courseId: string) {
    try {
      return await this.prisma.enrollment.findMany({
        where: { courseId },
        include: { student: true },
      });
    } catch (error) {
      console.error('CRITICAL GET STUDENTS ERROR:', error);
      throw new InternalServerErrorException(error.message || 'Something went wrong');
    }
  }
}
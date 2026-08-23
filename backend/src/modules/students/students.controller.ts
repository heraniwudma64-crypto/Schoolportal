import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentsService } from './students.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly prisma: PrismaService,
  ) {}

  // --- KB's Routes ---
  @Get('me/attendance')
  getMyAttendance(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMyAttendance(req.user.id);
  }

  @Get('me/courses')
  getMyCourses(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMyCourses(req.user.id);
  }

  @Get('me/schedule')
  getMySchedule(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMySchedule(req.user.id);
  }

  @Get('me/results')
  getMyResults(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMyResults(req.user.id);
  }

  // --- Heran's Routes ---
  @Get()
  async getStudentsByClass(@Query('className') className?: string) {
    // Fetch all students from Prisma with relations included
    const students = await this.prisma.student.findMany({
      where: className ? {
        OR: [
          { ClassSection: { name: className } },
        ],
      } : undefined,
      include: { ClassSection: true },
    });

    // If a className query parameter is provided, use safe in-memory fallback filtering
    if (className) {
      return students.filter((student: any) => 
        student.className === className || 
        student.gradeLevel === className ||
        student.ClassSection?.name === className
      );
    }

    return students;
  }
}
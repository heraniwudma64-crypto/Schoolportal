import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
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

  // ==========================================
  // 1. STATIC & "ME" ROUTES (Must be at the top)
  // ==========================================

  @Get('me/attendance')
  async getMyAttendance(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user.id;
    return await this.studentsService.getMyAttendance(userId);
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

  @Get('my-assignments')
  async getMyAssignments() {
    return this.studentsService.getMyAssignments();
  }

  @Get('class-sections')
  async getClassSections() {
    return this.prisma.classSection.findMany();
  }

  @Get('by-section')
  async getStudentsBySection(
    @Query('section') section?: string,
    @Query('subject') subject?: string,
  ) {
    return this.prisma.student.findMany({
      where: {
        OR: [
          ...(section ? [
            { classSectionId: section },       
            { ClassSection: { name: section } } 
          ] : [])
        ],
      },
      include: {
        ClassSection: true,
        User: true,
      },
    });
  }

  // ==========================================
  // 2. PARAMETERIZED & GENERIC ROUTES (At the bottom)
  // ==========================================

  @Get('by-class-section/:classSectionId')
  async getStudentsByClassSectionId(@Param('classSectionId') classSectionId: string) {
    return this.prisma.student.findMany({
      where: {
        classSectionId: classSectionId,
      },
      include: {
        ClassSection: true,
        User: true,
      },
    });
  }

  @Get()
  async getStudentsByClass(@Query('className') className?: string) {
    return this.prisma.student.findMany({
      where: className ? {
        OR: [
          { classSectionId: className },
          { ClassSection: { name: className } },
        ],
      } : undefined,
      include: { ClassSection: true, User: true },
    });
  }
}
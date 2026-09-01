import { Controller, Get, Post, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPastAttendance(
    @Req() req: Request & { user: { id: string } },
    @Query('classSectionId') classSectionId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('studentName') studentName?: string,
  ) {
    // Build query filters dynamically
    const where: any = {};
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: req.user.id }, select: { id: true } });
    if (teacher) {
      const assignments = await this.prisma.sectionSubjectTeacher.findMany({ where: { teacherId: teacher.id }, select: { classSectionId: true } });
      where.classSectionId = { in: assignments.map((assignment) => assignment.classSectionId) };
    }
    if (classSectionId) {
      where.classSectionId = classSectionId;
    }
    if (date) {
      // Match records for that specific day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (status) where.status = status;
    if (studentName) {
      where.Student = {
        OR: [
          { firstName: { contains: studentName, mode: 'insensitive' } },
          { lastName: { contains: studentName, mode: 'insensitive' } },
        ],
      };
    }

    const records = await this.prisma.studentAttendance.findMany({
      where,
      include: {
        Student: true, // Includes student details if your relation is named 'Student'
      },
      orderBy: {
        date: 'desc',
      },
    });

    return records;
  }

  @Post()
  async saveAttendance(
    @Body() body: any, 
    @Req() req: Request & { user: { id: string } }
  ) {
    const { classSectionId, date, period, records } = body;
    const teacherId = req.user?.id;
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: teacherId }, select: { id: true } });
    const canRecord = teacher && await this.prisma.sectionSubjectTeacher.findFirst({
      where: { teacherId: teacher.id, classSectionId },
      select: { id: true },
    });
    const homeroomAccess = teacher && await this.prisma.classSection.findFirst({
      where: { id: classSectionId, teacherId: teacher.id },
      select: { id: true },
    });
    if (!canRecord && !homeroomAccess) throw new ForbiddenException('You are not assigned to this section');
    const parsedDate = new Date(date);
    const parsedPeriod = Number(period);

    const attendancePromises = records.map((record: any) => {
      return this.prisma.studentAttendance.upsert({
        where: {
          // Note: This matches the unique composite key in your schema
          studentId_date_period: {
            studentId: record.studentId,
            date: parsedDate,
            period: parsedPeriod,
          },
        },
        update: {
          status: record.status, // Update status if already exists
          recordedById: teacherId,
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          classSectionId: classSectionId,
          studentId: record.studentId,
          recordedById: teacherId,
          date: parsedDate,
          period: parsedPeriod,
          status: record.status,
          updatedAt: new Date(),
        } as any,
      });
    });

    await Promise.all(attendancePromises);
    return { message: 'Attendance saved successfully' };
  }
}
import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
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
    @Query('classSectionId') classSectionId?: string,
    @Query('date') date?: string,
  ) {
    // Build query filters dynamically
    const where: any = {};
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
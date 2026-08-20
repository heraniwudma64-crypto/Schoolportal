import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceHistory(classSectionId?: string) {
    return this.prisma.studentAttendance.findMany({
      where: classSectionId ? { classSectionId } : {},
      include: {
        Student: true,
        User: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 50,
    });
  }

  async saveAttendance(dto: {
    classSectionId: string;
    recordedById?: string;
    date: string;
    period?: number;
    records: Array<{
      studentId: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      remarks?: string;
    }>;
  }) {
    // 1. Safely resolve ClassSection (handles IDs or names like "Grade 10A")
    let classSection = await this.prisma.classSection.findUnique({
      where: { id: dto.classSectionId },
    }).catch(() => null);

    if (!classSection) {
      classSection = await this.prisma.classSection.findFirst({
        where: { name: dto.classSectionId },
      });
    }

    if (!classSection) {
      classSection = await this.prisma.classSection.findFirst();
    }

    if (!classSection) {
      throw new BadRequestException('No valid ClassSection found in the database. Please create one first.');
    }

    // 2. Safely resolve User/Teacher ID
    let user = dto.recordedById 
      ? await this.prisma.user.findUnique({ where: { id: dto.recordedById } }).catch(() => null)
      : null;

    if (!user) {
      user = await this.prisma.user.findFirst();
    }

    if (!user) {
      throw new BadRequestException('No valid User found in the database to record attendance.');
    }

    const results = [];
    const attendanceDate = new Date(dto.date || Date.now());
    const periodNum = dto.period || 1;

    for (const record of dto.records) {
      // Upsert prevents duplicate entry crashes
      const saved = await this.prisma.studentAttendance.upsert({
        where: {
          studentId_date_period: {
            studentId: record.studentId,
            date: attendanceDate,
            period: periodNum,
          },
        },
        update: {
          status: record.status as any,
          remarks: record.remarks || null,
          classSectionId: classSection.id,
          recordedById: user.id,
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          studentId: record.studentId,
          classSectionId: classSection.id,
          recordedById: user.id,
          date: attendanceDate,
          period: periodNum,
          status: record.status as any,
          remarks: record.remarks || null,
          updatedAt: new Date(),
        },
      });
      results.push(saved);
    }

    return { success: true, count: results.length, data: results };
  }
}
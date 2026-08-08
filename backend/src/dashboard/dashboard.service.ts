import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(studentId: string) {
    // If Prisma client is not available (e.g., in this dev environment),
    // return a mocked dashboard payload so frontend can be tested.
    const prismaWrapper: any = this.prisma as any;
    const client = typeof prismaWrapper.getClient === 'function' ? prismaWrapper.getClient() : null;

    if (!client) {
      this.logger.log('Prisma client not available — returning mock dashboard data');
      const now = Date.now();
      return {
        totalSubjects: 5,
        pendingAssignments: 2,
        attendance: 92,
        average: 88,
        announcements: [
          { id: 'ann-1', title: 'Welcome Back!', description: 'School reopens next Monday.', date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: 'ann-2', title: 'Parent-Teacher Meeting', description: 'PTM scheduled for Friday.', date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        deadlines: [
          { id: 'dl-1', title: 'Math Homework', courseName: 'Mathematics', dueDate: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING' },
          { id: 'dl-2', title: 'Science Project', courseName: 'Science', dueDate: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'IN_PROGRESS' },
        ],
      };
    }

    try {
      const safeQuery = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await operation();
        } catch (error) {
          this.logger.warn(`Dashboard query failed for ${studentId}: ${error instanceof Error ? error.message : error}`);
          return fallback;
        }
      };

      const [totalSubjects, attendanceRecords, examAttempts, announcements, deadlines] = await Promise.all([
        safeQuery(() => client.enrollment.count({ where: { studentId } }), 0),
        safeQuery(() => client.attendance.findMany({ where: { studentId } }), []),
        safeQuery(() => client.examAttempt.findMany({ where: { studentId } }), []),
        safeQuery(() => client.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }), []),
        safeQuery(() => client.assignment.findMany({ where: { studentId }, orderBy: { dueDate: 'asc' }, take: 4 }), []),
      ]);

      const presentCount = attendanceRecords.filter((record: any) => record.status === 'PRESENT').length;
      const attendance = attendanceRecords.length
        ? Math.round((presentCount / attendanceRecords.length) * 100)
        : 0;

      const average = examAttempts.length
        ? Math.round(examAttempts.reduce((sum: number, attempt: any) => sum + Number(attempt.marksObtained), 0) / examAttempts.length)
        : 0;

      const pendingAssignments = deadlines.filter((deadline: any) => deadline.status !== 'COMPLETED').length;

      return {
        totalSubjects: totalSubjects || 0,
        pendingAssignments,
        attendance,
        average,
        announcements: announcements.map((announcement: any) => ({
          id: announcement.id,
          title: announcement.title,
          description: announcement.content,
          date: announcement.createdAt?.toISOString?.() ?? new Date().toISOString(),
        })),
        deadlines: deadlines.map((deadline: any) => ({
          id: deadline.id,
          title: deadline.title,
          courseName: deadline.courseName,
          dueDate: deadline.dueDate?.toISOString?.() ?? new Date().toISOString(),
          status: deadline.status,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to build dashboard payload', error);
      return {
        totalSubjects: 0,
        pendingAssignments: 0,
        attendance: 0,
        average: 0,
        announcements: [],
        deadlines: [],
      };
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: {
    enrollment: { count: jest.Mock };
    attendance: { findMany: jest.Mock };
    examAttempt: { findMany: jest.Mock };
    notice: { findMany: jest.Mock };
    assignment: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prismaService = {
      enrollment: { count: jest.fn() },
      attendance: { findMany: jest.fn() },
      examAttempt: { findMany: jest.fn() },
      notice: { findMany: jest.fn() },
      assignment: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('returns aggregated dashboard data for a student', async () => {
    prismaService.enrollment.count.mockResolvedValue(3);
    prismaService.attendance.findMany.mockResolvedValue([
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'ABSENT' },
    ]);
    prismaService.examAttempt.findMany.mockResolvedValue([
      { marksObtained: 90, grade: 'A' },
      { marksObtained: 85, grade: 'B+' },
    ]);
    prismaService.notice.findMany.mockResolvedValue([
      { id: '1', title: 'Parent Meeting', content: 'Bring IDs', createdAt: new Date('2026-08-01T10:00:00Z') },
    ]);
    prismaService.assignment.findMany.mockResolvedValue([
      { id: 'assignment-1', title: 'Upcoming Assignment', courseName: 'Mathematics', dueDate: new Date('2026-08-10T10:00:00Z'), status: 'PENDING' },
    ]);

    const result = await service.getDashboardData('student-1');

    expect(result).toEqual({
      totalSubjects: 3,
      pendingAssignments: 1,
      attendance: 67,
      average: 88,
      announcements: [
        expect.objectContaining({ title: 'Parent Meeting' }),
      ],
      deadlines: [
        expect.objectContaining({ title: 'Upcoming Assignment' }),
      ],
    });
  });
});

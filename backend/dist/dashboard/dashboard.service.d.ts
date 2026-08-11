import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDashboardData(studentId: string): Promise<{
        totalSubjects: number;
        pendingAssignments: number;
        attendance: number;
        average: number;
        announcements: {
            id: any;
            title: any;
            description: any;
            date: any;
        }[];
        deadlines: {
            id: any;
            title: any;
            courseName: any;
            dueDate: any;
            status: any;
        }[];
    }>;
}

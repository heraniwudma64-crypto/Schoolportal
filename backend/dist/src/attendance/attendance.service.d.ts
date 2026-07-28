import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
export declare class AttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    markAttendance(dto: {
        userId: string;
        courseId: string;
        status: AttendanceStatus;
        date?: string;
    }): Promise<{
        id: string;
        date: Date;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        userId: string;
        courseId: string | null;
    }>;
    getCourseAttendance(courseId: string): Promise<({
        user: {
            id: string;
            loginId: string;
            password: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        date: Date;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        userId: string;
        courseId: string | null;
    })[]>;
}

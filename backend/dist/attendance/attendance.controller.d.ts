import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from '@prisma/client';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    markAttendance(body: {
        userId: string;
        courseId: string;
        status: AttendanceStatus;
        date?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        courseId: string;
        date: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        userId: string;
    }>;
    getCourseAttendance(courseId: string): Promise<({
        user: {
            id: string;
            loginId: string;
            password: string;
            email: string | null;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        courseId: string;
        date: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        userId: string;
    })[]>;
}

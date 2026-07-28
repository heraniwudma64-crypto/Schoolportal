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

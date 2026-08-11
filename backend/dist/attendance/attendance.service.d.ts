import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    markAttendance(dto: {
        userId: string;
        courseId: string;
        status: AttendanceStatus;
        date?: string;
    }): Promise<any>;
    getCourseAttendance(courseId: string): Promise<any>;
}

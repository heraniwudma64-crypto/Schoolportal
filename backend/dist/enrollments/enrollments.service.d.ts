import { PrismaService } from '../prisma/prisma.service';
export declare class EnrollmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    enrollStudent(studentId: string, courseId: string): Promise<{
        id: string;
        createdAt: Date;
        courseId: string;
        studentId: string;
    }>;
    getCourseStudents(courseId: string): Promise<({
        student: {
            id: string;
            loginId: string;
            email: string | null;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        courseId: string;
        studentId: string;
    })[]>;
}

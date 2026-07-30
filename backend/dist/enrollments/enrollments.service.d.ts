import { PrismaService } from '../prisma/prisma.service';
export declare class EnrollmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    enrollStudent(studentId: string, courseId: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        courseId: string;
    }>;
    getCourseStudents(courseId: string): Promise<({
        student: {
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
        studentId: string;
        courseId: string;
    })[]>;
}

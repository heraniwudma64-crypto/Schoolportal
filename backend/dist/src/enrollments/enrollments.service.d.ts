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
            userId: string;
            classSectionId: string | null;
            admissionNo: string;
            firstName: string;
            lastName: string;
            parentId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        courseId: string;
        studentId: string;
    })[]>;
}

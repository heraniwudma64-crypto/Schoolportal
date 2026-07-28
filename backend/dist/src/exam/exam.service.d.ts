import { PrismaService } from '../prisma/prisma.service';
export declare class ExamService {
    private prisma;
    constructor(prisma: PrismaService);
    createExam(dto: {
        title: string;
        courseId: string;
        classSectionId?: string;
    }): Promise<{
        id: number;
        courseId: string;
        title: string;
        classSectionId: string | null;
    }>;
    recordAttempt(dto: {
        score: number;
        examId: string;
        userId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        score: number;
        studentId: string;
        examId: number;
    }>;
    getStudentAttempts(userId: string): Promise<({
        exam: {
            id: number;
            courseId: string;
            title: string;
            classSectionId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        score: number;
        studentId: string;
        examId: number;
    })[]>;
}

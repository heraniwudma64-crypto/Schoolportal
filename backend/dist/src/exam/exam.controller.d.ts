import { ExamService } from './exam.service';
export declare class ExamController {
    private readonly examService;
    constructor(examService: ExamService);
    createExam(body: {
        title: string;
        courseId: string;
        maxScore?: number;
    }): Promise<{
        id: number;
        courseId: string;
        title: string;
        classSectionId: string | null;
    }>;
    recordAttempt(body: {
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

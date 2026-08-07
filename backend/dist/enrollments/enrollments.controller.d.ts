import { EnrollmentsService } from './enrollments.service';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    enroll(courseId: string, req: any): Promise<{
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

import { EnrollmentsService } from './enrollments.service';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    enroll(courseId: string, req: any): Promise<{
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

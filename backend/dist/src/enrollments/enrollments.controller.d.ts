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

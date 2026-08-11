import { StudentsService } from './students.service';
interface RequestWithUser {
    user: {
        id: string;
        userId?: string;
        role: string;
    };
}
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    getStudentProfile(req: RequestWithUser): Promise<{
        message: string;
        student: any;
    }>;
}
export {};

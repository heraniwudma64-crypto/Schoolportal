import { StudentsService } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    getStudentProfile(req: any): Promise<{
        message: string;
        student: any;
    }>;
}

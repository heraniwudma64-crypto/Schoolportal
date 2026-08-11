import { TeachersService } from './teachers.service';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    getTeacherProfile(req: any): Promise<{
        message: string;
        teacher: any;
    }>;
}

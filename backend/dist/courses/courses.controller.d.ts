import { CoursesService } from './courses.service';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    findAll(): Promise<({
        teacher: {
            id: string;
            loginId: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        title: string;
        description: string | null;
        teacherId: string;
    })[]>;
    createCourse(body: {
        title: string;
        description?: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string | null;
        teacherId: string;
    }>;
}

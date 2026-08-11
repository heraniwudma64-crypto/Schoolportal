import { CoursesService } from './courses.service';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    findAll(): {
        id: number;
        title: string;
        description: string;
    }[];
    create(createCourseDto: any): any;
}

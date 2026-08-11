export declare class CoursesService {
    private courses;
    findAll(): {
        id: number;
        title: string;
        description: string;
    }[];
    create(createCourseDto: any): any;
}

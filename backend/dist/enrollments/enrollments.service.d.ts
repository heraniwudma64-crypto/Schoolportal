import { PrismaService } from '../prisma/prisma.service';
export declare class EnrollmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    enrollStudent(studentId: string, courseId: string): Promise<any>;
    getCourseStudents(courseId: string): Promise<any>;
}

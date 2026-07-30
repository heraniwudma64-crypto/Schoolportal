import { PrismaService } from '../prisma/prisma.service';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    createCourse(title: string, description: string, teacherId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string | null;
        teacherId: string;
    }>;
}

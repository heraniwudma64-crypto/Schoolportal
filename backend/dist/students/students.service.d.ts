import { PrismaService } from '../prisma/prisma.service';
export declare class StudentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(student: any): Promise<any>;
    getStudentProfile(userId: string): Promise<{
        message: string;
        student: any;
    }>;
}

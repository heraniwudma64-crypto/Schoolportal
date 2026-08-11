import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class StudentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(student: Prisma.StudentCreateInput): Promise<any>;
    getStudentProfile(userId: string): Promise<{
        message: string;
        student: any;
    }>;
}

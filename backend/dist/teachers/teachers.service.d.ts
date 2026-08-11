import { PrismaService } from '../prisma/prisma.service';
export declare class TeachersService {
    private prisma;
    constructor(prisma: PrismaService);
    getTeacherProfile(userId: string): Promise<{
        message: string;
        teacher: any;
    }>;
}

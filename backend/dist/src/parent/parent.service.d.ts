import { PrismaService } from '../prisma/prisma.service';
export declare class ParentService {
    private prisma;
    constructor(prisma: PrismaService);
    verifyAndGetChild(parentUserId: string, targetStudentUserId: string): Promise<{
        id: string;
        loginId: string;
        password: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}

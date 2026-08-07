import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    validateUser(loginId: string, pass: string): Promise<any>;
    login(loginId: string, pass: string): Promise<{
        message: string;
        user: any;
    }>;
    register(dto: any): Promise<{
        message: string;
        userId: string;
    }>;
}

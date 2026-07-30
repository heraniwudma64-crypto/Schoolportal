import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    validateUser(email: string, pass: string): Promise<any>;
    login(loginId: string, pass: string): Promise<{
        message: string;
        user: any;
    }>;
}

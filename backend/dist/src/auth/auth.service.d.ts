import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginId: string, pass: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: any;
            role: import("@prisma/client").$Enums.Role;
            loginId: string;
        };
    }>;
}

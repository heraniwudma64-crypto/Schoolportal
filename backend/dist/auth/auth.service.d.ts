import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginId: string, pass: string): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            loginId: any;
        };
    }>;
}

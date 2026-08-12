import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthController {
    private readonly authService;
    private readonly prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    register(body: any): Promise<any>;
    login(body: any): Promise<{
        message: string;
        role: any;
        userId: any;
    }>;
}

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthController {
    private readonly authService;
    private readonly prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    login(body: {
        loginId: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            loginId: any;
        };
    }>;
    getProfile(req: any): {
        message: string;
        user: any;
    };
    getAdminData(req: any): {
        message: string;
        user: any;
    };
}

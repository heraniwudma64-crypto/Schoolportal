import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    private readonly prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        loginId: string;
        password: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: any;
            role: import("@prisma/client").$Enums.Role;
            loginId: string;
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

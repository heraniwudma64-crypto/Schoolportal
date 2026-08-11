import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    private readonly prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    register(registerDto: RegisterDto): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        role: any;
        userId: any;
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

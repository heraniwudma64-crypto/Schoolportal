import { Role } from '@prisma/client';
export declare class RegisterDto {
    loginId: string;
    email: string;
    password: string;
    name?: string;
    role?: Role;
}

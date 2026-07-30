import { Role } from '@prisma/client';

export class RegisterDto {
  loginId: string; // Add this line
  email: string;
  password: string;
  name?: string;
  role?: Role; // Match the Prisma Role enum type
}
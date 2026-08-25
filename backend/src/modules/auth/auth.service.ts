import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeAuthUser = {
  id: string;
  name: string;
  loginId: string;
  email: string | null;
  role: Lowercase<Role>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto & { classId?: string; classSectionId?: string; grade?: string }) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const loginId = registerDto.idNumber.trim();
    const email = registerDto.email?.trim().toLowerCase();
    const role = this.mapRegisterRole(registerDto.role);

    const existingByLoginId = await this.prisma.user.findUnique({
      where: { loginId },
      select: { id: true },
    });
    if (existingByLoginId) {
      throw new ConflictException('A user with that ID number already exists');
    }

    if (email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingByEmail) {
        throw new ConflictException('A user with that email already exists');
      }
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const userId = randomUUID();

    const nameParts = registerDto.name ? registerDto.name.trim().split(/\s+/) : ['User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          loginId,
          email,
          password: passwordHash,
          role,
        },
        select: {
          id: true,
          loginId: true,
          email: true,
          role: true,
        },
      });

      if (role === Role.TEACHER) {
        await tx.teacher.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            firstName,
            lastName,
            updatedAt: new Date(),
          },
        });
      } else if (role === Role.STUDENT) {
        const classInput = (registerDto as any).classSectionId || (registerDto as any).classId || (registerDto as any).grade;
        let resolvedClassSectionId: string | null = null;

        if (classInput) {
          let sectionRecord = await tx.classSection.findFirst({
            where: {
              OR: [
                { id: classInput },
                { name: classInput },
              ],
            },
          });

          if (!sectionRecord) {
            sectionRecord = await tx.classSection.create({
              data: {
                id: randomUUID(),
                name: classInput,
                updatedAt: new Date(),
              },
            });
          }
          resolvedClassSectionId = sectionRecord.id;
        }

        await tx.student.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            admissionNo: loginId,
            firstName,
            lastName,
            gender: registerDto.gender,
            updatedAt: new Date(),
            ...(resolvedClassSectionId ? { classSectionId: resolvedClassSectionId } : {}),
          },
        });
      }

      return user;
    });

    const safeUser = this.toSafeUser(createdUser, registerDto.name);
    const accessToken = await this.signToken(createdUser.id, createdUser.role);

    return {
      accessToken,
      user: safeUser,
    };
  }

  async login(loginDto: LoginDto) {
    const identifier = loginDto.identifier.trim();
    const emailIdentifier = identifier.toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ loginId: identifier }, { email: emailIdentifier }],
      },
      select: {
        id: true,
        loginId: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        isDeleted: true,
      },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });

    const safeUser = this.toSafeUser(user);
    const accessToken = await this.signToken(user.id, user.role);

    return {
      accessToken,
      user: safeUser,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return { message: 'If the email exists, a password reset code has been sent.' };
    }
    // Implement token/OTP generation & email dispatching logic here
    return { message: 'Password reset OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    // Implement token/OTP verification logic here
    return { message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: passwordHash },
    });

    return { message: 'Password has been reset successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        isActive: true,
        isDeleted: true,
      },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.toSafeUser(user);
  }

  private async signToken(userId: string, role: Role) {
    return this.jwtService.signAsync({
      sub: userId,
      role,
    });
  }

  private mapRegisterRole(role?: string): Role {
    const normalized = role?.toLowerCase();
    if (!normalized) {
      return Role.STUDENT;
    }
    if (normalized === 'admin') {
      throw new UnauthorizedException('Admin accounts cannot be created via public registration');
    }
    if (normalized === 'teacher') {
      return Role.TEACHER;
    }
    if (normalized === 'parent') {
      return Role.PARENT;
    }
    return Role.STUDENT;
  }

  private toSafeUser(
    user: { id: string; loginId: string; email: string | null; role: Role },
    nameOverride?: string,
  ): SafeAuthUser {
    return {
      id: user.id,
      name: nameOverride?.trim() || user.loginId,
      loginId: user.loginId,
      email: user.email,
      role: user.role.toLowerCase() as Lowercase<Role>,
    };
  }
}
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

    // Split name into first and last name for profile records
    const nameParts = registerDto.name ? registerDto.name.trim().split(' ') : ['User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Use a transaction to create the user and their profile table record atomically
    const createdUser = await this.prisma.$transaction(async (prisma: any) => {
      // 1. Create the base user
      const user = await prisma.user.create({
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

      // 2. Create the role-specific profile record with required schema fields
      if (role === Role.TEACHER) {
        await prisma.teacher.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            firstName,
            lastName,
            updatedAt: new Date(),
          },
        });
     } else if (role === Role.STUDENT) {
  // This looks for whatever key your frontend sends the class/grade text under
  const classInput = (registerDto as any).classSectionId || (registerDto as any).classId || (registerDto as any).grade;
  let resolvedClassSectionId: string | null = null;

  if (classInput) {
    let sectionRecord = await prisma.classSection.findFirst({
      where: {
        OR: [
          { id: classInput },
          { name: classInput },
        ],
      },
    });

    if (!sectionRecord) {
      sectionRecord = await prisma.classSection.create({
        data: {
          id: randomUUID(),
          name: classInput,
          updatedAt: new Date(),
        },
      });
    }
    resolvedClassSectionId = sectionRecord.id;
  }

  await prisma.student.create({
    data: {
      id: randomUUID(),
      admissionNo: loginId,
      firstName,
      lastName,
      userId: user.id,
      updatedAt: new Date(),
      // This assigns the resolved UUID so it is never NULL again
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
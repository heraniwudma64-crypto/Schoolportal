<<<<<<< HEAD
import { Injectable , UnauthorizedException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'; // <--- Import bcrypt here

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(loginId: string, pass: string): Promise<any> {
    // Look up the user by email (or update to match your actual schema field like 'id' or 'email')
    const user = await this.prisma.user.findUnique({
      where: { email: loginId }, 
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  
  // Add this method to fix the auth service error
  async login(loginId: string, pass: string) {
    const user = await this.validateUser(loginId, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      message: 'Login successful',
      user,
    };
  }
  async register(dto: any) {
  const hashedPassword = await bcrypt.hash(dto.password, 10);

  // Split full name into first and last name
  const nameParts = (dto.fullName || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return await this.prisma.$transaction(async (prisma) => {
    // 1. Create the base User
    const user = await prisma.user.create({
      data: {
        loginId: dto.idNumber,
        email: dto.email || null,
        password: hashedPassword,
        role: dto.role, // STUDENT, TEACHER, ADMIN, PARENT
      },
    });

    // 2. Create the role-specific profile matching your updated schema
    if (dto.role === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          admissionNo: dto.idNumber,
          firstName,
          lastName,
          classGrade: dto.classGrade || null,
          address: dto.address || null,
          parentName: dto.parentName || null,
          parentPhone: dto.parentPhone || null,
          medicalStatus: dto.medicalStatus || null,
        },
      });
    } else if (dto.role === 'TEACHER' || dto.role === 'ADMIN') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          address: dto.address || null,
          medicalStatus: dto.medicalStatus || null,
        },
      });
    }

    return { message: 'User registered successfully', userId: user.id };
  });
}
}
=======
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginId: string, pass: string) {
    const user = await this.prisma.findFirst('user', {
      where: {
        OR: [{ loginId: loginId }, { email: loginId }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        loginId: user.loginId,
      },
    };
  }
}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

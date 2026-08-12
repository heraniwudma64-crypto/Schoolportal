import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    console.log('Incoming Register Payload:', body);
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const identifier = body.idNumber || body.loginId || body.email;

    return await this.prisma.user.create({
      data: {
        idNumber: body.idNumber || '',
        loginId: identifier,
        email: body.email || '',
        password: hashedPassword,
        role: body.role || 'TEACHER',
        fullName: body.fullName || '',
        gender: body.gender || '',
        classGrade: body.classGrade || '',
        parentName: body.parentName || '',
        parentPhone: body.parentPhone || '',
        address: body.address || '',
        medicalStatus: body.medicalStatus || '',
      },
    });
  }

  @Post('login')
  async login(@Body() body: any) {
    console.log('----------------- LOGIN ATTEMPT -----------------');
    console.log('Incoming Login Payload:', body);

    // This will print EVERY user stored in the database your backend is currently using
    const allUsers = await this.prisma.user.findMany();
    console.log('DEBUG: Users currently in THIS backend database:', allUsers.map(u => u.loginId || u.idNumber));

    const identifier = body.loginId || body.email || body.username || body.idNumber;

    if (!identifier) {
      throw new UnauthorizedException('Identifier is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { loginId: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
    
    if (!user) {
      console.log(`DEBUG: User '${identifier}' NOT found in this database.`);
      throw new UnauthorizedException('Invalid ID or password');
    }

    console.log('DEBUG: User successfully found! ID:', user.id);

    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      console.log('DEBUG: Password mismatch.');
      throw new UnauthorizedException('Invalid ID or password');
    }

    console.log('DEBUG: Login successful!');
    return { 
      message: 'Login successful', 
      role: user.role, 
      userId: user.id 
    };
  }
}
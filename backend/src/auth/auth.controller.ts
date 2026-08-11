import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegisterDto } from './dto/register.dto'; // <-- Import Register DTO
import { LoginDto } from './dto/login.dto';       // <-- Import Login DTO

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

@Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // 1. Log this to your backend terminal to see what the frontend is sending
    console.log('Incoming Register Payload:', registerDto);

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    return await this.prisma.user.create({
      data: {
        loginId: registerDto.idNumber || 'USER-' + Math.random().toString(36).substring(7),
        email: registerDto.email || '',
        password: hashedPassword,
        role: registerDto.role || 'TEACHER',
      },
    });
  }
  
  @Post('login')
async login(@Body() loginDto: LoginDto) {
  // 1. Find user by loginId
  const user = await this.prisma.user.findUnique({
    where: { loginId: loginDto.loginId },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 2. Compare passwords
  const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 3. Return user info or a JWT token
  return { 
    message: 'Login successful', 
    role: user.role, 
    userId: user.id 
  };
}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return {
      message: 'This is a protected route!',
      user: req.user,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin-dashboard')
  getAdminData(@Req() req) {
    return {
      message: 'Welcome to the secret admin dashboard!',
      user: req.user,
    };
  }
}
import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
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
  async register(@Body() registerDto: RegisterDto) { // <-- Use RegisterDto
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    return this.prisma.user.create({
      data: {
        loginId: registerDto.loginId,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role || Role.STUDENT,
      },
    });
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) { // <-- Use LoginDto
    return this.authService.login(loginDto.loginId, loginDto.password);
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
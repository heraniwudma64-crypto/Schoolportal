import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator'; // Import decorator
import { RolesGuard } from './guards/roles.guard';     // Import guard

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  async login(@Body() body: { loginId: string; password: string }) {
    return this.authService.login(body.loginId, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return {
      message: 'This is a protected route!',
      user: req.user,
    };
  }

  // --- NEW ADMIN-ONLY ROUTE ---
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Requires both valid token AND matching role
  @Roles('ADMIN')                          // Only ADMIN role allowed
  @Get('admin-dashboard')
  getAdminData(@Req() req) {
    return {
      message: 'Welcome to the secret admin dashboard!',
      user: req.user,
    };
  }
}
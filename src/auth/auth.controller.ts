import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

interface RequestWithUser {
  user: {
    id: string;
    email?: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { loginId: string; password: string }) {
    return this.authService.login(body.loginId, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return {
      message: 'This is a protected route!',
      user: req.user,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin-dashboard')
  getAdminData(@Req() req: RequestWithUser) {
    return {
      message: 'Welcome to the secret admin dashboard!',
      user: req.user,
    };
  }
}

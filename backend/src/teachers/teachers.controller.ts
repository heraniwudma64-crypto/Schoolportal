import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('profile')
  getTeacherProfile(@Req() req) {
    const userId = req.user.userId || req.user.id;
    return this.teachersService.getTeacherProfile(userId);
  }
}
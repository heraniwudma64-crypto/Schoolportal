import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('ADMIN')
  async getAllTeachers() {
    return this.teachersService.getAllTeachers();
  }

  @Get('dashboard-stats')
  @Roles('TEACHER', 'ADMIN')
  async getStats(@Req() req: any) {
    const teacherId = req.user.teacherId; 
    return this.teachersService.getTeacherDashboardStats(teacherId);
  }

  @Get('classes')
  @Roles('TEACHER', 'ADMIN')
  async getClasses(@Req() req: any) {
    const teacherId = req.user.teacherId;
    return this.teachersService.getAssignedClasses(teacherId);
  }
}
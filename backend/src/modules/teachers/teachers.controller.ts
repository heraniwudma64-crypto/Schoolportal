import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(Role.ADMIN)
  async getAllTeachers() {
    return this.teachersService.getAllTeachers();
  }

  @Get('me/homeroom-context')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getMyHomeroomContext(@Req() req: any) {
    return this.teachersService.getMyHomeroomContext(req.user.id);
  }

  @Get('dashboard-stats')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getStats(@Req() req: any) {
    const idOrUserId = req.user.teacherId || req.user.id; 
    return this.teachersService.getTeacherDashboardStats(idOrUserId);
  }

  @Get('classes')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getClasses(@Req() req: any) {
    const idOrUserId = req.user.teacherId || req.user.id;
    return this.teachersService.getAssignedClasses(idOrUserId);
  }

  @Get('assignments')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeachingAssignments(@Req() req: any) {
    return this.teachersService.getTeachingAssignments(req.user.id);
  }

  @Get('dashboard')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getDashboard(@Req() req: any) {
    return this.teachersService.getDashboard(req.user.id);
  }
}

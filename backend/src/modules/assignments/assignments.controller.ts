import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(Role.TEACHER)
  async createAssignment(@Body() body: any, @Req() req: any) {
    return this.assignmentsService.create(body, req.user?.sub || req.user?.id);
  }
  
  @Get('teacher')
  @Roles(Role.TEACHER)
  getTeacherAssignments(@Req() req: any) {
    return this.assignmentsService.findTeacherAssignments(req.user?.sub || req.user?.id);
  }
  
  @Get(':id/submissions')
  @Roles(Role.TEACHER)
  getSubmissions(@Param('id') id: string, @Req() req: any) {
    return this.assignmentsService.findSubmissions(id, req.user?.sub || req.user?.id);
  }
}
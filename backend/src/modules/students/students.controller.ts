import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me/attendance')
  getMyAttendance(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMyAttendance(req.user.id);
  }

  @Get('me/courses')
  getMyCourses(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMyCourses(req.user.id);
  }

  @Get('me/schedule')
  getMySchedule(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMySchedule(req.user.id);
  }

  @Get('me/results')
  getMyResults(@Req() req: Request & { user: { id: string } }) {
    return this.studentsService.getMyResults(req.user.id);
  }
}

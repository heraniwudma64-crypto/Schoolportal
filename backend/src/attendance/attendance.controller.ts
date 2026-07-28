import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceStatus } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles('TEACHER', 'ADMIN')
  @Post()
  markAttendance(
    @Body() body: { userId: string; courseId: string; status: AttendanceStatus; date?: string }, // <-- Changed studentId to userId
  ) {
    return this.attendanceService.markAttendance(body);
  }

  @Roles('TEACHER', 'ADMIN')
  @Get('course/:courseId')
  getCourseAttendance(@Param('courseId') courseId: string) {
    return this.attendanceService.getCourseAttendance(courseId);
  }
}
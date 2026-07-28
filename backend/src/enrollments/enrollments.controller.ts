import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Roles('STUDENT')
  @Post(':courseId')
  enroll(@Param('courseId') courseId: string, @Req() req) {
    const studentId = req.user.userId || req.user.id;
    return this.enrollmentsService.enrollStudent(studentId, courseId);
  }

  @Roles('TEACHER', 'ADMIN')
  @Get('course/:courseId')
  getCourseStudents(@Param('courseId') courseId: string) {
    return this.enrollmentsService.getCourseStudents(courseId);
  }
}
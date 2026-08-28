import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teacher-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TeacherAssignmentsController {
  constructor(private readonly teacherAssignmentsService: TeacherAssignmentsService) {}

  @Get('homeroom')
  getHomeRoomAssignments(@Query('academicYearId') academicYearId?: string) {
    return this.teacherAssignmentsService.getHomeRoomAssignments(academicYearId);
  }

  @Post('homeroom')
  assignHomeRoomTeacher(
    @Body('classSectionId') classSectionId: string,
    @Body('teacherId') teacherId: string | null
  ) {
    return this.teacherAssignmentsService.assignHomeRoomTeacher(classSectionId, teacherId);
  }

  @Get('subject')
  getSubjectAssignments(@Query('academicYearId') academicYearId?: string) {
    return this.teacherAssignmentsService.getSubjectAssignments(academicYearId);
  }

  @Post('subject')
  assignSubjectTeacher(
    @Body('classSectionId') classSectionId: string,
    @Body('subjectId') subjectId: string,
    @Body('teacherId') teacherId: string,
    @Body('academicYearId') academicYearId: string
  ) {
    return this.teacherAssignmentsService.assignSubjectTeacher(classSectionId, subjectId, teacherId, academicYearId);
  }

  @Delete('subject/:id')
  removeSubjectTeacher(@Param('id') id: string) {
    return this.teacherAssignmentsService.removeSubjectTeacher(id);
  }
}

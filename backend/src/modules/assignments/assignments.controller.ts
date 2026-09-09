import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) { }

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

  @Get('homeroom-submissions')
  @Roles(Role.TEACHER)
  getHomeroomSubmissions(@Req() req: any) {
    return this.assignmentsService.findHomeroomSubmissions(req.user?.sub || req.user?.id);
  }

  @Get(':id/submissions')
  @Roles(Role.TEACHER)
  getSubmissions(@Param('id') id: string, @Req() req: any) {
    return this.assignmentsService.findSubmissions(id, req.user?.sub || req.user?.id);
  }

  @Get('submissions')
  @Roles(Role.TEACHER)
  getAllSubmissions(@Req() req: any) {
    return this.assignmentsService.findAllTeacherSubmissions(req.user?.sub || req.user?.id);
  }

  @Post('submissions/:submissionId/grade')
  @Roles(Role.TEACHER)
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: { score: number; maxScore?: number },
    @Req() req: any,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, body, req.user?.sub || req.user?.id);
  }

  @Get('submissions/:submissionId/file')
  @Roles(Role.TEACHER)
  getSubmissionFile(
    @Param('submissionId') submissionId: string,
    @Req() req: any,
  ) {
    return this.assignmentsService.getSubmissionFileUrl(submissionId, req.user?.sub || req.user?.id);
  }
}
import { Controller, Get, Post, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('examinations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get('form-data')
  async getFormData() {
    return this.examinationsService.getFormData();
  }

  @Get('teacher')
  @Roles(Role.TEACHER)
  async getTeacherExams(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new UnauthorizedException('User ID not found in request');
    return this.examinationsService.findTeacherExaminations(userId);
  }

  @Post()
  @Roles(Role.TEACHER)
  async createExamination(@Body() dto: any, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new UnauthorizedException('User ID not found in request');
    return this.examinationsService.createExamination(dto, userId);
  }

  @Get('approved')
  async getApprovedExams() {
    return this.examinationsService.findApprovedExaminations();
  }

  @Get('pending')
  @Roles(Role.ADMIN)
  async getPendingExams() {
    return this.examinationsService.findPendingExaminations();
  }

  @Post(':id/status')
  @Roles(Role.ADMIN)
  async changeExamStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.examinationsService.updateExamStatus(id, body.status);
  }

  @Post('submit')
  @Roles(Role.STUDENT)
  async submitExam(
    @Body()
    dto: {
      examinationId: string;
      studentId: string;
      answers: Array<{ questionId: string; selectedOptionId: string }>;
    },
  ) {
    return this.examinationsService.submitAndAutoGrade(dto);
  }
}
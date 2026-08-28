import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';

@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Post()
  async createExamination(@Body() dto: any) {
    return this.examinationsService.createExamination(dto);
  }

  @Get('approved')
  async getApprovedExams() {
    return this.examinationsService.findApprovedExaminations();
  }

  @Get('pending')
  async getPendingExams() {
    return this.examinationsService.findPendingExaminations();
  }

  @Post(':id/status')
  async changeExamStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.examinationsService.updateExamStatus(id, body.status);
  }

  @Post('submit')
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
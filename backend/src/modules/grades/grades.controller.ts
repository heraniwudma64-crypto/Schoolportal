import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { GradesService } from './grades.service';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  async saveGrades(@Body() dto: any) {
    try {
      return await this.gradesService.submitBatchGrades(dto);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Internal server error';
      throw new HttpException(
        { success: false, message: errorMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('exam/:examinationId')
  async getExamGrades(@Param('examinationId') examinationId: string) {
    return this.gradesService.getExamGrades(examinationId);
  }
}
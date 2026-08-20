import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('examinations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  async createExam(
    @Req() req: Request & { user: any }, 
    @Body() dto: { title: string; date: string; classId: string; subjectId: string }
  ) {
    const teacherId = req.user.teacherId;
    return this.examinationsService.createExam({ ...dto, teacherId });
  }

  @Get()
  @Roles('TEACHER', 'ADMIN')
  async getExams(@Req() req: Request & { user: any }) {
    const teacherId = req.user.teacherId;
    return this.examinationsService.getTeacherExams(teacherId);
  }
}
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  // ── Form data for the create/edit form ─────────────────────────────────────
  @Get('form-data')
  @UseGuards(JwtAuthGuard)
  getFormData(@Req() req: any) {
    return this.examinationsService.getTeacherFormData(req.user.id);
  }

  // ── Teacher's own exam list ─────────────────────────────────────────────────
  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  getTeacherExams(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new UnauthorizedException('User unauthenticated');
    return this.examinationsService.findTeacherExaminations(userId);
  }

  // ── Teacher's DRAFT exams ───────────────────────────────────────────────────
  @Get('drafts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  getDrafts(@Req() req: any) {
    return this.examinationsService.getDrafts(req.user.id);
  }

  // ── Teacher's APPROVED exams (returned/released back by admin) ─────────────
  @Get('approved-for-teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  getApprovedForTeacher(@Req() req: any) {
    return this.examinationsService.findApprovedForTeacher(req.user.id);
  }

  // ── Admin: all APPROVED exams (global) ────────────────────────────────────
  @Get('approved')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getApproved() {
    return this.examinationsService.findApprovedExaminations();
  }

  // ── Admin: all PENDING exams awaiting review ───────────────────────────────
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPending() {
    return this.examinationsService.findPendingExaminations();
  }

  // ── Create a new examination (TEACHER) ────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  createExamination(@Body() dto: any, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.examinationsService.createExamination(dto, userId);
  }

  // ── Update an examination (TEACHER — owns the exam) ───────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  updateExamination(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.examinationsService.updateExamination(id, dto, req.user.id);
  }

  // ── Delete a draft (TEACHER — owns the draft) ─────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  deleteDraft(@Param('id') id: string, @Req() req: any) {
    return this.examinationsService.deleteDraft(id, req.user?.sub || req.user?.id);
  }

  /**
   * Admin review action — PATCH /examinations/:id/review
   *
   * Accepts  { status: 'APPROVED' | 'REJECTED', rejectionReason?: string }
   * Only ADMIN may call this endpoint.  Replaces the old unguarded
   * PATCH :id/status route so no teacher can self-approve their own exam.
   */
  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reviewExam(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
  ) {
    return this.examinationsService.reviewExam(id, body.status, body.rejectionReason);
  }

  // ── Student submission & auto-grade ───────────────────────────────────────
  @Post('submit')
  submitExam(@Body() dto: any) {
    return this.examinationsService.submitAndAutoGrade(dto);
  }
}

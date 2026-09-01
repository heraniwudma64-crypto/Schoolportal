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
  UnauthorizedException 
} from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get('form-data')
  @UseGuards(JwtAuthGuard)
  async getFormData(@Req() req: any) {
    return this.examinationsService.getTeacherFormData(req.user.id);
  }

  @Get('teacher')
  @UseGuards(JwtAuthGuard)
  async getTeacherExams(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new UnauthorizedException('User unauthenticated');
    return this.examinationsService.findTeacherExaminations(userId);
  }

  @Get('drafts')
  @UseGuards(JwtAuthGuard)
  async getDrafts(@Req() req: any) {
    return this.examinationsService.getDrafts(req.user.id);
  }

  @Get('approved')
  async getApproved() {
    return this.examinationsService.findApprovedExaminations();
  }

  @Get('pending')
  async getPending() {
    return this.examinationsService.findPendingExaminations();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createExamination(@Body() dto: any, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.examinationsService.createExamination(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateExamination(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.examinationsService.updateExamination(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteDraft(@Param('id') id: string, @Req() req: any) {
    return this.examinationsService.deleteDraft(id, req.user?.sub || req.user?.id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.examinationsService.updateExamStatus(id, body.status);
  }

  @Post('submit')
  async submitExam(@Body() dto: any) {
    return this.examinationsService.submitAndAutoGrade(dto);
  }
}

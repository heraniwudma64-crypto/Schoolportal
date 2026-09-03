import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ReviewVideoDto } from './dto/review-video.dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // ── Teacher: Create a new video (Draft or Direct Submit) ───────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  create(@Body() dto: CreateVideoDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.videosService.create(dto, userId);
  }

  // ── Teacher: List videos submitted by this teacher ────────────────────────
  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  findAllForTeacher(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.videosService.findAllForTeacher(userId);
  }

  // ── Teacher: Update video (draft or rejected) ──────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.videosService.update(id, dto, userId);
  }

  // ── Teacher: Submit a draft or rejected video for Admin Review ─────────────
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  submitForReview(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.videosService.submitForReview(id, userId);
  }

  // ── Teacher / Admin: Delete video ──────────────────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const role = req.user?.role;
    return this.videosService.delete(id, userId, role);
  }

  // ── Admin: List all video submissions (optionally filter by status) ─────────
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllForAdmin(@Query('status') status?: string) {
    return this.videosService.findAllForAdmin(status);
  }

  // ── Admin: Approve or Reject a video submission ────────────────────────────
  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reviewVideo(
    @Param('id') id: string,
    @Body() dto: ReviewVideoDto,
    @Req() req: any,
  ) {
    const adminUserId = req.user?.sub || req.user?.id;
    return this.videosService.reviewVideo(id, dto, adminUserId);
  }

  // ── Student: List approved videos matched to enrolled section & subject ───
  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  findApprovedForStudent(
    @Query('subjectId') subjectId: string | undefined,
    @Req() req: any,
  ) {
    const studentUserId = req.user?.sub || req.user?.id;
    return this.videosService.findApprovedForStudent(studentUserId, subjectId);
  }

  // ── Filter Options: Available Subjects & Class Sections ────────────────────
  @Get('filter-options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.STUDENT)
  getFilterOptions(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const role = req.user?.role;
    return this.videosService.getFilterOptions(userId, role);
  }
}

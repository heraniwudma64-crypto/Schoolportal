import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { BulkSaveScheduleDto } from './dto/bulk-save-schedule.dto';
import { PublishScheduleDto } from './dto/publish-schedule.dto';

@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // ─── Period Management Endpoints ────────────────────────────────────────────

  @Get('periods')
  @Roles('ADMIN', 'TEACHER')
  getPeriods(
    @Query('academicYearId') academicYearId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.timetableService.getPeriods(
      academicYearId,
      includeInactive === 'true',
    );
  }

  @Post('periods')
  @Roles('ADMIN')
  createPeriod(@Body() dto: CreatePeriodDto) {
    return this.timetableService.createPeriod(dto);
  }

  @Patch('periods/:id')
  @Roles('ADMIN')
  updatePeriod(@Param('id') id: string, @Body() dto: UpdatePeriodDto) {
    return this.timetableService.updatePeriod(id, dto);
  }

  @Delete('periods/:id')
  @Roles('ADMIN')
  deletePeriod(@Param('id') id: string) {
    return this.timetableService.deletePeriod(id);
  }

  // ─── Section Schedule Management Endpoints ──────────────────────────────────

  @Get('section/:classSectionId')
  @Roles('ADMIN', 'TEACHER')
  getSectionSchedule(
    @Param('classSectionId') classSectionId: string,
    @Req() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.timetableService.getSectionSchedule(
      classSectionId,
      req.user,
      academicYearId,
    );
  }

  @Put('section/:classSectionId/draft')
  @Roles('ADMIN')
  saveDraftSchedule(
    @Param('classSectionId') classSectionId: string,
    @Body() dto: BulkSaveScheduleDto,
  ) {
    return this.timetableService.saveDraftSchedule(classSectionId, dto);
  }

  @Put('section/:classSectionId/publish')
  @Roles('ADMIN')
  publishSchedule(
    @Param('classSectionId') classSectionId: string,
    @Body() dto: PublishScheduleDto,
  ) {
    return this.timetableService.publishSchedule(classSectionId, dto);
  }

  @Delete('entries/:id')
  @Roles('ADMIN')
  deleteEntry(@Param('id') id: string) {
    return this.timetableService.deleteEntry(id);
  }

  // ─── Consumer Schedule Endpoints (Sub-Stage 2.4) ────────────────────────────

  @Get('me/teacher')
  @Roles('TEACHER')
  getTeacherSchedule(
    @Req() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.timetableService.getTeacherSchedule(req.user.id, academicYearId);
  }

  @Get('teacher/:teacherId')
  @Roles('ADMIN')
  getTeacherScheduleById(
    @Param('teacherId') teacherId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.timetableService.getTeacherScheduleById(teacherId, academicYearId);
  }

  @Get('me/student')
  @Roles('STUDENT')
  getStudentSchedule(
    @Req() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.timetableService.getStudentSchedule(req.user.id, academicYearId);
  }
}

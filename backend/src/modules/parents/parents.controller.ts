import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParentsService } from './parents.service';

type AuthRequest = Request & { user: { id: string; role: Role } };

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me')
  async getMyProfile(@Req() req: AuthRequest) {
    return this.parentsService.getMyProfile(req.user.id);
  }

  @Get('me/children')
  async getMyChildren(@Req() req: AuthRequest) {
    return this.parentsService.getMyChildren(req.user.id);
  }

  @Get('me/children/:studentId/attendance')
  async getChildAttendance(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parentsService.getChildAttendance(req.user.id, studentId);
  }

  @Get('me/children/:studentId/results')
  async getChildResults(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parentsService.getChildResults(req.user.id, studentId);
  }

  @Get('me/children/:studentId/report-card')
  async getChildReportCard(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('termId') termId?: string,
  ) {
    return this.parentsService.getChildReportCard(req.user.id, studentId, termId);
  }

  @Get('me/children/:studentId/assignments')
  async getChildAssignments(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parentsService.getChildAssignments(req.user.id, studentId);
  }

  @Get('me/children/:studentId/schedule')
  async getChildSchedule(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parentsService.getChildSchedule(req.user.id, studentId);
  }
}


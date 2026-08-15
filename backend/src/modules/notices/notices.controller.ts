import { Controller, Post, Body, UseGuards, Get, Patch, Param, Delete, Req } from '@nestjs/common';
import { NoticesService, CreateNoticeDto, UpdateNoticeDto } from './notices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, NoticeStatus } from '@prisma/client';
import { Request } from 'express';

@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  createNotice(
    @Req() req: Request & { user: { id: string, role: Role } },
    @Body() data: CreateNoticeDto
  ) {
    return this.noticesService.createNotice(req.user.id, req.user.role, data);
  }

  @Get()
  getUserNotices(
    @Req() req: Request & { user: { id: string, role: Role } },
  ) {
    return this.noticesService.getUserNotices(req.user.id, req.user.role);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  getAdminNotices() {
    return this.noticesService.getAdminNotices();
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  updateNotice(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string, role: Role } },
    @Body() data: UpdateNoticeDto
  ) {
    return this.noticesService.updateNotice(id, req.user.id, req.user.role, data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  deleteNotice(@Param('id') id: string) {
    return this.noticesService.deleteNotice(id);
  }
}

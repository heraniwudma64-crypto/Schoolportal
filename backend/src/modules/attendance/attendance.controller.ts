import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service'; // ⚠️ Make sure this import is present

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  async getHistory(@Query('classSectionId') classSectionId?: string) {
    return this.attendanceService.getAttendanceHistory(classSectionId);
  }

  @Post()
  async saveAttendance(@Body() dto: any) {
    return this.attendanceService.saveAttendance(dto);
  }
}
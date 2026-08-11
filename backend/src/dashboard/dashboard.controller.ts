import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query('studentId') studentId?: string) {
    return this.dashboardService.getDashboardData(studentId ?? 'student-1');
  }

  @Get(':studentId')
  async getDashboardById(@Param('studentId') studentId: string) {
    return this.dashboardService.getDashboardData(studentId);
  }
}

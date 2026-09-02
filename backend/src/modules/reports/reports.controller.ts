import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /admin/reports/sections?academicYearId=…
   *
   * Returns every class section for the given academic year (defaults to the
   * current year) with:
   *   - homeroom teacher name
   *   - enrolled student count
   *   - per-section submission status: how many subjects have ALL marks SUBMITTED
   */
  @Get('sections')
  getSections(@Query('academicYearId') academicYearId?: string) {
    return this.reportsService.getAdminSectionsSummary(academicYearId);
  }

  /**
   * GET /admin/reports/sections/:classSectionId/roster?academicYearId=…
   *
   * Full consolidated roster for a single class section (delegates to the
   * existing generateClassRoster logic that already powers the homeroom view).
   */
  @Get('sections/:classSectionId/roster')
  getSectionRoster(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('term') term?: string,
  ) {
    return this.reportsService.generateClassRoster(classSectionId, academicYearId, term ?? 'TERM_1');
  }

  /**
   * GET /admin/reports/sections/:classSectionId/report-cards?academicYearId=…
   *
   * Compiled report cards for every student in the section.
   */
  @Get('sections/:classSectionId/report-cards')
  getSectionReportCards(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.reportsService.getCompiledReportCards(classSectionId, academicYearId);
  }
}

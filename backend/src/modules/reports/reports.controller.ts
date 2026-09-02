import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(Role.ADMIN)
  getSections(@Query('academicYearId') academicYearId?: string) {
    return this.reportsService.getAdminSectionsSummary(academicYearId);
  }

  /**
   * GET /admin/reports/sections/:classSectionId/roster?academicYearId=…
   *
   * Full consolidated roster for a single class section.
   */
  @Get('sections/:classSectionId/roster')
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
  getSectionReportCards(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.reportsService.getCompiledReportCards(classSectionId, academicYearId);
  }

  /**
   * POST /admin/reports/homeroom/submit-to-admin
   *
   * Called by a HOMEROOM TEACHER to formally dispatch their section's
   * finalized roster and report cards to the admin portal for review.
   *
   * Validates:
   *   - caller is a teacher
   *   - caller is the registered homeroom teacher for the section
   *   - all assigned subjects have SUBMITTED results (allSubmitted = true)
   *
   * Returns a submission receipt the frontend can display.
   */
  @Post('homeroom/submit-to-admin')
  @Roles(Role.TEACHER)
  submitToAdmin(
    @Body() body: { classSectionId: string; academicYearId: string; type: 'roster' | 'report-cards' | 'both' },
    @Req() req: any,
  ) {
    return this.reportsService.submitToAdmin(body.classSectionId, body.academicYearId, body.type, req.user.id);
  }
}

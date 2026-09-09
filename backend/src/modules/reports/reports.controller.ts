import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { SaveRosterDraftDto, SaveConductDto, SubmitRosterDto, RejectRosterDto, ReopenRosterDto } from './dto/roster-review.dto';

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
   * GET /admin/reports/roster-reviews?status=...&academicYearId=...&classSectionId=...
   *
   * Admin-only review queue listing with filtering and safe audit metadata.
   */
  @Get('roster-reviews')
  @Roles(Role.ADMIN)
  getRosterReviews(
    @Query('status') status?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('classSectionId') classSectionId?: string,
  ) {
    return this.reportsService.getRosterReviews({ status, academicYearId, classSectionId });
  }

  /**
   * GET /admin/reports/sections/:classSectionId/full-roster?academicYearId=…
   *
   * Authoritative calculation roster for admin review with dynamic subjects and 7 academic periods.
   */
  @Get('sections/:classSectionId/full-roster')
  @Roles(Role.ADMIN)
  getFullSectionRoster(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.reportsService.getFullSectionRoster(classSectionId, academicYearId);
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
   * GET /admin/reports/roster/:classSectionId/print?academicYearId=…
   *
   * Official printable roster data. Strictly requires ClassRosterReview.status === 'APPROVED'.
   */
  @Get('roster/:classSectionId/print')
  @Roles(Role.ADMIN, Role.TEACHER)
  getOfficialPrintRoster(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Req() req: any,
  ) {
    return this.reportsService.getOfficialPrintRoster(
      classSectionId,
      academicYearId,
      req.user?.id,
      req.user?.role,
    );
  }

  /**
   * GET /admin/reports/roster-status/:classSectionId?academicYearId=…
   * Also accessible via /admin/reports/sections/:classSectionId/review
   *
   * Homeroom teacher or Admin inspects the roster review workflow state.
   */
  @Get('roster-status/:classSectionId')
  @Roles(Role.ADMIN, Role.TEACHER)
  getRosterStatus(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Req() req: any,
  ) {
    return this.reportsService.getRosterStatus(classSectionId, academicYearId, req.user?.id, req.user?.role);
  }

  @Get('sections/:classSectionId/review')
  @Roles(Role.ADMIN, Role.TEACHER)
  getSectionReview(
    @Param('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Req() req: any,
  ) {
    return this.reportsService.getRosterStatus(classSectionId, academicYearId, req.user?.id, req.user?.role);
  }

  /**
   * POST /admin/reports/homeroom/save-draft
   *
   * Save roster draft by homeroom teacher. Status remains DRAFT.
   */
  @Post('homeroom/save-draft')
  @Roles(Role.TEACHER)
  saveDraft(
    @Body() body: SaveRosterDraftDto,
    @Req() req: any,
  ) {
    return this.reportsService.saveRosterDraft(body, req.user.id);
  }

  /**
   * POST /admin/reports/homeroom/save-conduct
   *
   * Save student conduct grades by homeroom teacher.
   * Only valid values are 'A', 'B', or 'C'.
   * Only active enrolled students can receive conduct.
   * Allowed in DRAFT and REJECTED states; locked in SUBMITTED_TO_ADMIN and APPROVED.
   */
  @Post('homeroom/save-conduct')
  @Roles(Role.TEACHER)
  saveConduct(
    @Body() body: SaveConductDto,
    @Req() req: any,
  ) {
    return this.reportsService.saveConduct(body, req.user.id);
  }

  /**
   * POST /admin/reports/homeroom/submit-to-admin
   *
   * Called by a HOMEROOM TEACHER to formally dispatch their section's
   * finalized roster to the admin portal for review.
   *
   * Validates:
   *   - caller is a teacher
   *   - caller is the registered homeroom teacher for the section
   *   - section is ACTIVE
   *   - all assigned subjects have SUBMITTED results
   *
   * Stamped status in ClassRosterReview: SUBMITTED_TO_ADMIN.
   * ClassSection.status is NEVER modified.
   */
  @Post('homeroom/submit-to-admin')
  @Roles(Role.TEACHER)
  submitToAdmin(
    @Body() body: SubmitRosterDto,
    @Req() req: any,
  ) {
    return this.reportsService.submitToAdmin(body.classSectionId, body.academicYearId, body.type, req.user.id, body.conductData);
  }

  /**
   * POST /admin/reports/roster-reviews/:reviewId/approve
   *
   * Admin-only operation to approve a submitted roster.
   */
  @Post('roster-reviews/:reviewId/approve')
  @Roles(Role.ADMIN)
  approveRoster(
    @Param('reviewId') reviewId: string,
    @Req() req: any,
  ) {
    return this.reportsService.approveRoster(reviewId, req.user.id);
  }

  /**
   * POST /admin/reports/roster-reviews/:reviewId/reject
   *
   * Admin-only operation to reject a submitted roster with a required reason.
   */
  @Post('roster-reviews/:reviewId/reject')
  @Roles(Role.ADMIN)
  rejectRoster(
    @Param('reviewId') reviewId: string,
    @Body() body: RejectRosterDto,
    @Req() req: any,
  ) {
    return this.reportsService.rejectRoster(reviewId, req.user.id, body.reason);
  }

  /**
   * POST /admin/reports/roster-reviews/:reviewId/reopen
   *
   * Admin-only operation to reopen an approved roster back to DRAFT with a reason.
   */
  @Post('roster-reviews/:reviewId/reopen')
  @Roles(Role.ADMIN)
  reopenRoster(
    @Param('reviewId') reviewId: string,
    @Body() body: ReopenRosterDto,
    @Req() req: any,
  ) {
    return this.reportsService.reopenRoster(reviewId, req.user.id, body.reason);
  }
}

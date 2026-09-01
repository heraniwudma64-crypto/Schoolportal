import { Body, Controller, Get, Post, Req, UseGuards, Param, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post('draft')
  saveDraft(@Body() body: any, @Req() req: any) {
    return this.resultsService.saveGradesDraft(body, req.user.id);
  }

  @Post('submit-to-homeroom')
  submitToHomeroom(@Body() body: any, @Req() req: any) {
    return this.resultsService.submitToHomeroom(body, req.user.id);
  }

  @Post('publish-student')
  publishStudent(@Body() body: any, @Req() req: any) {
    return this.resultsService.publishStudentResult(body, req.user.id);
  }

  @Get('homeroom-teachers/:classSectionId/:academicYearId')
  getHomeroomTeachers(
    @Param('classSectionId') classSectionId: string,
    @Param('academicYearId') academicYearId: string
  ) {
    return this.resultsService.getHomeroomTeachers(classSectionId, academicYearId);
  }

  @Get('homeroom-matrix')
  getHomeroomMatrix(
    @Req() req: any,
    @Query('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('term') term: string,
  ) {
    return this.resultsService.getHomeroomSubmissionMatrix(
      classSectionId,
      academicYearId,
      term,
      req.user.id,
    );
  }

  @Get('student-results')
  getStudentResults(
    @Req() req: any,
    @Query('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('term') term: string
  ) {
    return this.resultsService.getStudentResults(classSectionId, academicYearId, term, req.user.id);
  }
}

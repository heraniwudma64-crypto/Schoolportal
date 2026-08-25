import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportCardsService } from './report-cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('report-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}



  @Get('filters/terms')
  getTerms(@Query('academicYearId') academicYearId: string) {
    return this.reportCardsService.getTerms(academicYearId);
  }

  @Get('students')
  getStudents(
    @Query('classSectionId') classSectionId: string, 
    @Query('search') search?: string
  ) {
    return this.reportCardsService.getStudents(classSectionId, search);
  }

  @Get('student/:id')
  getReportCard(
    @Param('id') studentId: string,
    @Query('classSectionId') classSectionId: string,
    @Query('termId') termId: string,
  ) {
    return this.reportCardsService.getReportCard(studentId, classSectionId, termId);
  }
}

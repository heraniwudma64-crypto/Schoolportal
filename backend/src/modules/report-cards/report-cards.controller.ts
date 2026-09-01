import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ReportCardsService } from './report-cards.service';
import { TeachersService } from '../teachers/teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('report-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
export class ReportCardsController {
  constructor(
    private readonly reportCardsService: ReportCardsService,
    private readonly teachersService: TeachersService,
  ) {}

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

  @Get('class-roster')
  async getRoster(
    @Req() req: any, 
    @Query('classSectionId') classSectionId: string
  ) {
    // If user is a teacher, verify their live homeroom assignment
    if (req.user?.role === Role.TEACHER) {
      await this.teachersService.verifyHomeroomAccess(req.user.id, classSectionId);
    }
    return this.reportCardsService.generateClassRoster(classSectionId);
  }

  @Get('student/:id')
  async getReportCard(
    @Req() req: any,
    @Param('id') studentId: string,
    @Query('classSectionId') classSectionId: string,
    @Query('termId') termId: string,
  ) {
    if (req.user?.role === Role.TEACHER) {
      await this.teachersService.verifyHomeroomAccess(req.user.id, classSectionId);
    }
    return this.reportCardsService.getReportCard(studentId, classSectionId, termId);
  }

  @Get('compiled')
  async getCompiledReportCards(
    @Req() req: any,
    @Query('classSectionId') classSectionId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    if (req.user?.role === Role.TEACHER) {
      await this.teachersService.verifyHomeroomAccess(req.user.id, classSectionId);
    }
    return this.reportCardsService.getCompiledReportCards(classSectionId, academicYearId);
  }
}
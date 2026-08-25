import { Controller, Get, Post, Body, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { RosterService } from './roster.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roster')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @Get()
  @Roles('ADMIN', 'TEACHER')
  async getRoster(
    @Query('academicYearId') academicYearId: string,
    @Query('classSectionId') classSectionId: string
  ) {
    return this.rosterService.getRoster(academicYearId, classSectionId);
  }

  @Get('summary')
  @Roles('ADMIN', 'TEACHER')
  async getSummary(
    @Query('academicYearId') academicYearId: string,
    @Query('classSectionId') classSectionId: string
  ) {
    return this.rosterService.getSummary(academicYearId, classSectionId);
  }

  @Post('enroll')
  @Roles('ADMIN')
  async enrollStudent(@Body(new ValidationPipe({ whitelist: true })) body: any) {
    return this.rosterService.enrollStudent({
      studentId: body.studentId,
      academicYearId: body.academicYearId,
      gradeLevelId: body.gradeLevelId,
      classSectionId: body.classSectionId,
      enrollmentDate: body.enrollmentDate,
      status: body.status || 'ACTIVE'
    });
  }
}

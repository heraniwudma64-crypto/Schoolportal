import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AcademicStructureService } from './academic-structure.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('academic-structure')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AcademicStructureController {
  constructor(private readonly academicStructureService: AcademicStructureService) {}

  @Get('years')
  // Teachers need the active academic year to load homeroom submissions,
  // consolidated rosters, and report cards. Mutating academic structure
  // endpoints remain protected by the controller-level ADMIN role.
  @Roles(Role.ADMIN, Role.TEACHER)
  getAcademicYears() {
    return this.academicStructureService.getAcademicYears();
  }

  @Post('years')
  createAcademicYear(@Body() data: { label: string; startDate: string; endDate: string }) {
    return this.academicStructureService.createAcademicYear({
      label: data.label,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Post('years/:id/activate')
  activateAcademicYear(@Param('id') id: string) {
    return this.academicStructureService.activateAcademicYear(id);
  }

  @Get('grades')
  getGradeLevels(@Query('academicYearId') academicYearId?: string) {
    return this.academicStructureService.getGradeLevels(academicYearId);
  }

  @Post('grades')
  createGradeLevel(@Body() data: { name: string; gradeNumber?: number; description?: string }) {
    return this.academicStructureService.createGradeLevel(data);
  }

  @Post('sections')
  createSection(@Body() data: { gradeLevelId: string; name: string }) {
    return this.academicStructureService.createSection(data);
  }

  @Get('subjects')
  getSubjects() {
    return this.academicStructureService.getSubjects();
  }

  @Post('subjects')
  createSubject(@Body() data: { name: string; code: string; type?: string; description?: string }) {
    return this.academicStructureService.createSubject(data);
  }

  @Get('grade-subjects')
  getGradeSubjects() {
    return this.academicStructureService.getGradeSubjects();
  }

  @Post('grades/:id/subjects')
  assignSubjectToGrade(
    @Param('id') gradeLevelId: string,
    @Body() data: { subjectId: string; academicYearId?: string },
  ) {
    return this.academicStructureService.assignSubjectToGrade({
      gradeLevelId,
      subjectId: data.subjectId,
      academicYearId: data.academicYearId,
    });
  }

  @Delete('grade-subjects/:id')
  unassignSubjectFromGrade(@Param('id') id: string) {
    return this.academicStructureService.unassignSubjectFromGrade(id);
  }

  @Get('promotions/eligible/:academicYearId')
  getEligibleStudents(@Param('academicYearId') academicYearId: string) {
    return this.academicStructureService.getEligibleStudents(academicYearId);
  }

  @Post('promotions')
  promoteStudents(
    @Body()
    data: {
      sourceYearId: string;
      targetYearId: string;
      promotions: Array<{
        studentId: string;
        targetGradeLevelId: string;
        targetSectionId: string;
      }>;
    },
  ) {
    return this.academicStructureService.promoteStudents(data);
  }
}

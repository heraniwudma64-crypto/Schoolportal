import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicStructureModule } from './modules/academic-structure/academic-structure.module';
import { NoticesModule } from './modules/notices/notices.module';
import { AppController } from './app.controller';
import { StudentsModule } from './modules/students/students.module';

import { TeachersModule } from './modules/teachers/teachers.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { GradesModule } from './modules/grades/grades.module';
import { RosterModule } from './modules/roster/roster.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ReportCardsModule } from './modules/report-cards/report-cards.module';
import { TeacherAssignmentsModule } from './modules/teacher-assignments/teacher-assignments.module';
import { ParentsModule } from './modules/parents/parents.module';
import { ResultsModule } from './modules/results/results.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicStructureModule,
    NoticesModule,
    StudentsModule,
    TeachersModule,
    AttendanceModule,
    AssignmentsModule,
    ExaminationsModule,
    GradesModule,
    RosterModule,
    MaterialsModule,
    ReportCardsModule,
    TeacherAssignmentsModule,
    ParentsModule,
    ResultsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

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
    ScheduleModule.forRoot(),
   
  ],
  
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { FeeModule } from './fee/fee.module';
import { AcademicYearModule } from './academic-year/academic-year.module';
import { ClassSectionModule } from './class-section/class-section.module';
import { TimetableModule } from './timetable/timetable.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExamModule } from './exam/exam.module';
import { ReportCardModule } from './report-card/report-card.module';
import { ExportModule } from './export/export.module';
import { NoticeModule } from './notice/notice.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { TeachersModule } from './teachers/teachers.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [PrismaModule, AuthModule, StudentsModule, FeeModule, AcademicYearModule, ClassSectionModule, TimetableModule, AttendanceModule, ExamModule, ReportCardModule, ExportModule, NoticeModule, DashboardModule, UsersModule, TeachersModule, CoursesModule, EnrollmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

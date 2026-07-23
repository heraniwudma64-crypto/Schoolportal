import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
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

@Module({
  imports: [PrismaModule, AuthModule, StudentModule, FeeModule, AcademicYearModule, ClassSectionModule, TimetableModule, AttendanceModule, ExamModule, ReportCardModule, ExportModule, NoticeModule, DashboardModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

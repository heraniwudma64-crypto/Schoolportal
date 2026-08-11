import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
<<<<<<< HEAD
import { FeeModule } from './fee/fee.module';
import { AcademicYearModule } from './academic-year/academic-year.module';
//import { ClassSectionModule } from './class-section/class-section.module';
//import { TimetableModule } from './timetable/timetable.module';
//import { ExamModule } from './exam/exam.module';
//import { ReportCardModule } from './report-card/report-card.module';
//import { ExportModule } from './export/export.module';
//import { NoticeModule } from './notice/notice.module';
//import { DashboardModule } from './dashboard/dashboard.module';
=======
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
import { StudentsModule } from './students/students.module';
import { AdminModule } from './admin/admin.module';
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

@Module({
  imports: [
    PrismaModule,
    AuthModule,
<<<<<<< HEAD
    FeeModule,
    AcademicYearModule,
  // ClassSectionModule,
    //TimetableModule,
    //ExamModule,
    //ReportCardModule,
    //ExportModule,
    //NoticeModule,
    //DashboardModule,
=======
    AdminModule,
    StudentModule,
    StudentsModule,
    FeeModule,
    AcademicYearModule,
    ClassSectionModule,
    TimetableModule,
    AttendanceModule,
    ExamModule,
    ReportCardModule,
    ExportModule,
    NoticeModule,
    DashboardModule,
    UsersModule,
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
  ],
  controllers: [AppController],
  providers: [AppService],
})
<<<<<<< HEAD
export class AppModule {}
=======
export class AppModule {}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

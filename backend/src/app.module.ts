import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FeeModule } from './fee/fee.module';
import { AcademicYearModule } from './academic-year/academic-year.module';
//import { ClassSectionModule } from './class-section/class-section.module';
//import { TimetableModule } from './timetable/timetable.module';
//import { ExamModule } from './exam/exam.module';
//import { ReportCardModule } from './report-card/report-card.module';
//import { ExportModule } from './export/export.module';
//import { NoticeModule } from './notice/notice.module';
//import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FeeModule,
    AcademicYearModule,
  // ClassSectionModule,
    //TimetableModule,
    //ExamModule,
    //ReportCardModule,
    //ExportModule,
    //NoticeModule,
    //DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

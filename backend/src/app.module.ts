import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicStructureModule } from './modules/academic-structure/academic-structure.module';
import { NoticesModule } from './modules/notices/notices.module';
import { RosterModule } from './modules/roster/roster.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ReportCardsModule } from './modules/report-cards/report-cards.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicStructureModule,
    NoticesModule,
    RosterModule,
    MaterialsModule,
    ReportCardsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

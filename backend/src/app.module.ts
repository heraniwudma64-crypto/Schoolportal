import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicStructureModule } from './modules/academic-structure/academic-structure.module';
import { NoticesModule } from './modules/notices/notices.module';
import { MaterialsModule } from './modules/materials/materials.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicStructureModule,
    NoticesModule,
    MaterialsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicStructureModule } from './modules/academic-structure/academic-structure.module';
import { NoticesModule } from './modules/notices/notices.module';
import { AppController } from './app.controller';
import { StudentsModule } from './modules/students/students.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicStructureModule,
    NoticesModule,
    StudentsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

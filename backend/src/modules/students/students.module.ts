import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [PrismaModule, UsersModule, TimetableModule],
  controllers: [StudentsController],
  providers: [StudentsService, PrismaService],
  exports: [StudentsService],
})
export class StudentsModule {}

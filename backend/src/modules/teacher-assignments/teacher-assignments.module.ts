import { Module } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService],
})
export class TeacherAssignmentsModule {}

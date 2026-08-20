import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [StudentsController],
  providers: [PrismaService],
})
export class StudentsModule {}
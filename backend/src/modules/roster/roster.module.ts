import { Module } from '@nestjs/common';
import { RosterService } from './roster.service';
import { RosterController } from './roster.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TeachersModule } from '../teachers/teachers.module';

@Module({
  imports: [PrismaModule, TeachersModule],
  controllers: [RosterController],
  providers: [RosterService],
  exports: [RosterService],
})
export class RosterModule {}

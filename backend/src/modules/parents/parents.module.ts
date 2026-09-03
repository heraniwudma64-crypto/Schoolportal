import { Module } from '@nestjs/common';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ReportCardsModule } from '../report-cards/report-cards.module';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [PrismaModule, ReportCardsModule, TimetableModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}

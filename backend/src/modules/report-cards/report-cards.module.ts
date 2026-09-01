import { Module } from '@nestjs/common';
import { ReportCardsService } from './report-cards.service';
import { ReportCardsController } from './report-cards.controller';
import { TeachersModule } from '../teachers/teachers.module'; // Import the module

@Module({
  imports: [TeachersModule], // Add it to the imports array
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
  exports: [ReportCardsService],
})
export class ReportCardsModule {}
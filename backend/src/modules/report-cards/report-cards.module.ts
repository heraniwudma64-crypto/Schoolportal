import { Module } from '@nestjs/common';
import { ReportCardsController } from './report-cards.controller';
import { ReportCardsService } from './report-cards.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
})
export class ReportCardsModule {}

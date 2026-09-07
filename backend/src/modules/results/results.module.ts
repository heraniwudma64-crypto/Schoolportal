import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { CalculationService } from './calculation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResultsController],
  providers: [ResultsService, CalculationService],
  exports: [ResultsService, CalculationService],
})
export class ResultsModule {}

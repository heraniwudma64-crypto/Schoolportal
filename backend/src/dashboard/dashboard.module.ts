import { Module } from '@nestjs/common';
<<<<<<< HEAD

@Module({})
=======
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
export class DashboardModule {}

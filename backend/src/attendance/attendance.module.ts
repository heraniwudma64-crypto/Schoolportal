import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
=======

@Module({})
export class AttendanceModule {}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

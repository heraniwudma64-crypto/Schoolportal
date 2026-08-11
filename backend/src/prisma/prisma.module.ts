<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService]
=======
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
})
export class PrismaModule {}

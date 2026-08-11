import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
<<<<<<< HEAD
import { PrismaModule } from '../prisma/prisma.module'; // Ensure PrismaModule is imported if needed

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
=======

@Module({
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

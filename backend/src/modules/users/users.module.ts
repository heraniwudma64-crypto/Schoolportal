import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { AccountController } from './account.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, AccountController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

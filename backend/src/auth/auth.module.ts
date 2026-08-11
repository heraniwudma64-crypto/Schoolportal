import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
=======
import { AuthService } from './auth.service'; // Corrected import path
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path if your PrismaModule is elsewhere

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_super_secret_key_here',
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule, // Needed so PrismaService works in AuthService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // Registers both the service and the JWT passport strategy
})
export class AuthModule {}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

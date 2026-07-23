import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello(): Promise<string> {
    try {
      const userCount = await this.prisma.user.count();
      return `Database connection successful! Total users in database: ${userCount}`;
    } catch (error) {
      return `Database connection failed: ${error.message}`;
    }
  }
}
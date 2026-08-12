import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello(): Promise<string> {
    try {
      const userCount = await this.prisma.count('user');
      return `Database connection successful! Total users in database: ${userCount}`;
    } catch (error) {

      return `Database connection failed: ${error instanceof Error ? error.message : String(error)}`;

    }
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ DATABASE CONNECTION SUCCESSFUL!');
    } catch (error) {
      console.error('❌ DATABASE CONNECTION FAILED:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export { PrismaService };
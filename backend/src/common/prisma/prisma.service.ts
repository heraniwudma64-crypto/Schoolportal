import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Retry connection up to 5 times with back-off to handle
    // transient Supabase pooler latency at cold start.
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connection established');
        return;
      } catch (err) {
        const isLast = attempt === 5;
        this.logger.warn(
          `DB connect attempt ${attempt}/5 failed: ${(err as Error).message.split('\n')[0]}`,
        );
        if (isLast) throw err;
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

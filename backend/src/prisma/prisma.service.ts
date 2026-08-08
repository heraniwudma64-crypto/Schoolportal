import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit {
  private client: any;

  constructor() {
    this.client = null;
  }

  async onModuleInit() {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { Pool } = await import('pg');

      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        this.client = new PrismaClient();
        return;
      }

      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      this.client = new PrismaClient({ adapter });
      await this.client.$connect();
    } catch (error) {
      this.client = null;
    }
  }

  public getClient() {
    return this.client;
  }
  // Expose client-like properties so existing code can call `prisma.user.findMany()` etc.
  // When the real Prisma client isn't available, expose stub methods that return safe defaults.
  public get user(): any {
    return (
      this.client?.user ?? {
        findFirst: async () => null,
        findMany: async () => [],
        create: async () => null,
        count: async () => 0,
      }
    );
  }

  public get student(): any {
    return (
      this.client?.student ?? {
        findMany: async () => [],
        create: async () => null,
        findUnique: async () => null,
      }
    );
  }

  public get enrollment(): any {
    return (
      this.client?.enrollment ?? {
        count: async () => 0,
        findMany: async () => [],
      }
    );
  }

  public get attendance(): any {
    return (
      this.client?.attendance ?? {
        findMany: async () => [],
      }
    );
  }

  public get examAttempt(): any {
    return (
      this.client?.examAttempt ?? {
        findMany: async () => [],
      }
    );
  }

  public get notice(): any {
    return (
      this.client?.notice ?? {
        findMany: async () => [],
      }
    );
  }

  public get assignment(): any {
    return (
      this.client?.assignment ?? {
        findMany: async () => [],
      }
    );
  }

  // Generic helpers used by some services (keeps previous API shape)
  public async count(model: string, where?: any): Promise<number> {
    try {
      if (this.client && this.client[model] && typeof this.client[model].count === 'function') {
        return await this.client[model].count({ where });
      }
    } catch (e) {
      // ignore
    }
    return 0;
  }

  public async findFirst(model: string, args?: any): Promise<any> {
    try {
      if (this.client && this.client[model] && typeof this.client[model].findFirst === 'function') {
        return await this.client[model].findFirst(args);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public async findMany(model: string, args?: any): Promise<any[]> {
    try {
      if (this.client && this.client[model] && typeof this.client[model].findMany === 'function') {
        return await this.client[model].findMany(args);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  public async findUnique(model: string, args?: any): Promise<any> {
    try {
      if (this.client && this.client[model] && typeof this.client[model].findUnique === 'function') {
        return await this.client[model].findUnique(args);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public async create(model: string, args?: any): Promise<any> {
    try {
      if (this.client && this.client[model] && typeof this.client[model].create === 'function') {
        return await this.client[model].create(args);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }
}

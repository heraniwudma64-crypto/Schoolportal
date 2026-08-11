import { Injectable } from '@nestjs/common';
<<<<<<< HEAD

@Injectable()
export class AppService {
  getHello(): string {
    return 'School Portal API is running!';
  }
}
=======
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello(): Promise<string> {
    try {
      const userCount = await this.prisma.count('user');
      return `Database connection successful! Total users in database: ${userCount}`;
    } catch (error) {
<<<<<<<< HEAD:src/app.service.ts
      const err = error as Error;
      return `Database connection failed: ${err.message}`;
========
      return `Database connection failed: ${error instanceof Error ? error.message : String(error)}`;
>>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b:backend/src/app.service.ts
    }
  }
}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

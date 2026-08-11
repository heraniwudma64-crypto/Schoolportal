import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
<<<<<<< HEAD
  getHello(): string {
    return this.appService.getHello();
  }
}
=======
  async getHello(): Promise<string> {
    return this.appService.getHello();
  }
}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b

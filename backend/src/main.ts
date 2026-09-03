import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.getHttpAdapter().getInstance().set('etag', false);
  app.useGlobalInterceptors(new PerformanceInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
     // whitelist: true,
      //forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

bootstrap();

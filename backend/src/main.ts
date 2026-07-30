import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so your React frontend can make API requests
  app.enableCors();

  // Set the port to 4000 (matching your frontend request)
  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}

bootstrap();
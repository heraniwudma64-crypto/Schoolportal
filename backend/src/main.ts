import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
<<<<<<< HEAD

  // Enable CORS so your React frontend can make API requests
  app.enableCors();

  // Set the port to 5000 (matching your frontend request)
  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}

=======
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });
  await app.listen(5000);
}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
bootstrap();
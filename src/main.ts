import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    console.log('Server started successfully!');
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}
bootstrap();

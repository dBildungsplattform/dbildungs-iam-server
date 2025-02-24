/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { INestApplication } from '@nestjs/common';

async function bootstrap(): Promise<void> {
    const app: INestApplication = await NestFactory.create(AppModule);
    await app.listen(process.env['PORT'] ?? 3000);
}

bootstrap().catch((error: unknown) => console.error('Failed to start microservice with error:', error));

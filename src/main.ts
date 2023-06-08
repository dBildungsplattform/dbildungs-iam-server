import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ServerModule } from './server.module.js';
import { HostConfig } from './shared/index.js';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(ServerModule);
    const configService = app.get(ConfigService);
    await app.listen(configService.getOrThrow<HostConfig>('HOST').PORT);
    console.log(`\nListening on: http://127.0.0.1:${configService.getOrThrow<HostConfig>('HOST').PORT}`);
}

bootstrap()
    .then(() => {
        console.log('Server started successfully!');
    })
    .catch((error) => {
        console.error('Failed to start server:', error);
    });

/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { HostConfig, ServerConfig } from './shared/index.js';
import { ServerModule } from './server.module.js';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(ServerModule);
    const configService = app.get(ConfigService<ServerConfig, true>);
    const port = configService.getOrThrow<HostConfig>('HOST').PORT;
    await app.listen(port);
    console.info(`\nListening on: http://127.0.0.1:${port}`);
}

bootstrap().catch((error) => console.error('Failed to start server with error:', error));

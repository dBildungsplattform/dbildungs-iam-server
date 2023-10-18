/* eslint-disable no-console */
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';

import { FrontendConfig, ServerConfig } from '../shared/config/index.js';
import { GlobalValidationPipe } from '../shared/validation/index.js';
import { BackendForFrontendModule } from './backend-for-frontend.module.js';

async function bootstrap(): Promise<void> {
    const app: INestApplication = await NestFactory.create(BackendForFrontendModule);
    app.useGlobalPipes(new GlobalValidationPipe());
    const swagger: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
        .setTitle('dBildungs IAM')
        .setDescription('The dBildungs IAM server API description')
        .setVersion('1.0')
        .build();

    app.setGlobalPrefix('api', {
        exclude: ['health'],
    });
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

    const configService: ConfigService<ServerConfig, true> = app.get(ConfigService<ServerConfig, true>);
    const frontendConfig: FrontendConfig = configService.getOrThrow<FrontendConfig>('FRONTEND');

    app.use(
        session({
            secret: frontendConfig.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: frontendConfig.SECURE_COOKIE, httpOnly: true },
        }),
    );

    const port: number = frontendConfig.PORT;
    await app.listen(port);

    console.info(`\nListening on: http://127.0.0.1:${port}`);
    console.info(`API documentation can be found on: http://127.0.0.1:${port}/docs`);
}

bootstrap().catch((error: unknown) => console.error('Failed to start server with error:', error));

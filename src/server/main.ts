/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import RedisStore from 'connect-redis';
import session from 'express-session';
import passport from 'passport';
import { createClient, RedisClientType } from 'redis';
import { NestLogger } from '../core/logging/nest-logger.js';
import { FrontendConfig, HostConfig, KeycloakConfig, RedisConfig, ServerConfig } from '../shared/config/index.js';
import { GlobalValidationPipe } from '../shared/validation/index.js';
import { ServerModule } from './server.module.js';
import { GlobalPagingHeadersInterceptor } from '../shared/paging/index.js';
import { sessionAccessTokenMiddleware } from '../modules/authentication/services/session-access-token.middleware.js';

async function bootstrap(): Promise<void> {
    const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(ServerModule);
    const configService: ConfigService<ServerConfig, true> = app.get(ConfigService<ServerConfig, true>);
    const backendHostname: string | undefined = configService.getOrThrow<HostConfig>('HOST').HOSTNAME;
    const port: number = configService.getOrThrow<HostConfig>('HOST').PORT;
    const keycloakConfig: KeycloakConfig = configService.getOrThrow<KeycloakConfig>('KEYCLOAK');

    const swagger: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
        .setTitle('dBildungs IAM')
        .setDescription('The dBildungs IAM server API description')
        .setVersion('1.0')
        .addOAuth2({
            type: 'oauth2',
            flows: {
                authorizationCode: {
                    authorizationUrl: `${keycloakConfig.BASE_URL}/realms/${keycloakConfig.REALM_NAME}/protocol/openid-connect/auth`,
                    tokenUrl: `${keycloakConfig.BASE_URL}/realms/${keycloakConfig.REALM_NAME}/protocol/openid-connect/token`,
                    refreshUrl: `${keycloakConfig.BASE_URL}/realms/${keycloakConfig.REALM_NAME}/protocol/openid-connect/token`,
                    scopes: {},
                },
            },
        })
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        })
        .build();

    app.useLogger(app.get(NestLogger));
    app.useGlobalInterceptors(new GlobalPagingHeadersInterceptor());
    app.useGlobalPipes(new GlobalValidationPipe());
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    });

    let redirectUrl: string;
    if (backendHostname) {
        redirectUrl = `https://${backendHostname}:${port}/docs/oauth2-redirect.html`;
    } else {
        redirectUrl = `http://localhost:${port}/docs/oauth2-redirect.html`;
    }

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger), {
        swaggerOptions: {
            persistAuthorization: true,
            initOAuth: {
                clientId: keycloakConfig.CLIENT_ID,
                realm: keycloakConfig.REALM_NAME,
                scopes: [],
            },
            oauth2RedirectUrl: redirectUrl,
        },
    });

    const frontendConfig: FrontendConfig = configService.getOrThrow<FrontendConfig>('FRONTEND');
    if (frontendConfig.TRUST_PROXY !== undefined) {
        app.set('trust proxy', frontendConfig.TRUST_PROXY);
    }

    const redisConfig: RedisConfig = configService.getOrThrow<RedisConfig>('REDIS');
    const redisClient: RedisClientType = createClient({
        username: redisConfig.USERNAME,
        password: redisConfig.PASSWORD,
        socket: {
            host: redisConfig.HOST,
            port: redisConfig.PORT,
            tls: redisConfig.USE_TLS,
            key: redisConfig.PRIVATE_KEY,
            cert: redisConfig.CERTIFICATE_AUTHORITIES,
        },
    });

    /*
    Just retrying does not work.
    Once the connection has failed if no error handler is registered later connection attemps might just fail because
    the client library assumes termination of the process if failure
    Also the documentation expressly requires listening to on('error')
     */

    await redisClient
        .on('error', (error: Error) => app.get(NestLogger).error(`Redis connection failed: ${error.message}`))
        .connect();
    app.get(NestLogger).log('Redis-connection made');

    const redisStore: RedisStore = new RedisStore({
        client: redisClient,
    });

    app.use(
        session({
            store: redisStore,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            cookie: {
                maxAge: frontendConfig.SESSION_TTL_MS,
                secure: frontendConfig.SECURE_COOKIE,
            },
            secret: frontendConfig.SESSION_SECRET,
        }),
    );

    app.use(passport.initialize({ userProperty: 'passportUser' }));
    app.use(passport.session());
    app.use(sessionAccessTokenMiddleware);

    await app.listen(port);

    console.info(`\nListening on: http://127.0.0.1:${port}`);
    console.info(`API documentation can be found on: http://127.0.0.1:${port}/docs`);
}

bootstrap().catch((error: unknown) => console.error('Failed to start server with error:', error));

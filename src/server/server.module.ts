import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { defineConfig } from '@mikro-orm/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, FrontendConfig, loadConfigFiles, RedisConfig, ServerConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/index.js';
import { PersonApiModule } from '../modules/person/person-api.module.js';
import { KeycloakAdministrationModule } from '../modules/keycloak-administration/keycloak-administration.module.js';
import { OrganisationApiModule } from '../modules/organisation/organisation-api.module.js';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from '../modules/health/health.module.js';
import { PrivacyIdeaAdministrationModule } from '../modules/privacy-idea-administration/privacy-idea-administration.module.js';
import { RolleApiModule } from '../modules/rolle/rolle-api.module.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { ErrorModule } from '../shared/error/error.module.js';
import { KeycloakConfigModule } from '../modules/keycloak-administration/keycloak-config.module.js';
import { AuthenticationApiModule } from '../modules/authentication/authentication-api.module.js';
import { PersonenKontextApiModule } from '../modules/personenkontext/personenkontext-api.module.js';
import { ServiceProviderApiModule } from '../modules/service-provider/service-provider-api.module.js';
import { SessionAccessTokenMiddleware } from '../modules/authentication/services/session-access-token.middleware.js';
import { createClient, createCluster, RedisClientType, RedisClusterType } from 'redis';
import RedisStore from 'connect-redis';
import session from 'express-session';
import passport from 'passport';
import { ClassLogger } from '../core/logging/class-logger.js';
import { AccessGuard } from '../modules/authentication/api/access.guard.js';
import { PermissionsInterceptor } from '../modules/authentication/services/permissions.interceptor.js';
import { PassportModule } from '@nestjs/passport';
import { EventModule } from '../core/eventbus/index.js';
import { ItsLearningModule } from '../modules/itslearning/itslearning.module.js';
import { LdapModule } from '../core/ldap/ldap.module.js';
import { EmailModule } from '../modules/email/email.module.js';
import { OxModule } from '../modules/ox/ox.module.js';
import { KeycloakHandlerModule } from '../modules/keycloak-handler/keycloak-handler.module.js';
import { CronModule } from '../modules/cron/cron.module.js';
import { ImportApiModule } from '../modules/import/import-api.module.js';
import { ReporterModule } from '../modules/metrics/reporter/reporter.module.js';
import { StatusModule } from '../modules/status/status.module.js';
import { SpshConfigModule } from '../modules/spshconfig/spshconfig.module.js';
import { VidisModule } from '../modules/vidis/vidis.module.js';
import { MeldungModule } from '../modules/meldung/meldung.module.js';
import { MapperModule } from '../modules/person/mapper/mapper.module.js';
import { LandesbediensteterModule } from '../modules/landesbediensteter/landesbediensteter.module.js';
import { SchulconnexModule } from '../modules/schulconnex/schulconnex.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadConfigFiles],
        }),
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
            namingConventions: new CamelCaseNamingConvention(),
            errorHandler: mappingErrorHandler,
        }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigService<ServerConfig, true>) => {
                const dbConfig: DbConfig = config.getOrThrow<DbConfig>('DB');
                return defineConfig({
                    clientUrl: dbConfig.CLIENT_URL,
                    user: dbConfig.USERNAME,
                    password: dbConfig.SECRET,
                    dbName: dbConfig.DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                    // Needed for HealthCheck
                    driverOptions: {
                        connection: {
                            ssl: dbConfig.USE_SSL,
                        },
                    },
                    connect: false,
                });
            },
            inject: [ConfigService],
        }),
        PassportModule.register({
            session: true,
            defaultStrategy: ['api-key', 'jwt', 'oidc'],
            keepSessionInfo: true,
            property: 'passportUser',
        }),
        LoggerModule.register(ServerModule.name),
        EventModule,
        AuthenticationApiModule,
        PersonApiModule,
        OrganisationApiModule,
        KeycloakAdministrationModule,
        HealthModule,
        RolleApiModule,
        ServiceProviderApiModule,
        PersonenKontextApiModule,
        ErrorModule,
        KeycloakConfigModule,
        ItsLearningModule,
        LdapModule,
        EmailModule,
        OxModule,
        PrivacyIdeaAdministrationModule,
        KeycloakHandlerModule,
        CronModule,
        ImportApiModule,
        ReporterModule,
        StatusModule,
        SpshConfigModule,
        VidisModule,
        MeldungModule,
        MapperModule,
        LandesbediensteterModule,
        SchulconnexModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AccessGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PermissionsInterceptor,
        },
    ],
})
export class ServerModule implements NestModule {
    public constructor(
        private configService: ConfigService,
        private logger: ClassLogger,
    ) {}

    public async configure(consumer: MiddlewareConsumer): Promise<void> {
        const redisConfig: RedisConfig = this.configService.getOrThrow<RedisConfig>('REDIS');
        let redisClient: RedisClientType | RedisClusterType;
        /* istanbul ignore next */
        if (redisConfig.CLUSTERED) {
            redisClient = createCluster({
                defaults: {
                    username: redisConfig.USERNAME,
                    password: redisConfig.PASSWORD,
                },
                rootNodes: [
                    {
                        socket: {
                            host: redisConfig.HOST,
                            port: redisConfig.PORT,
                            tls: redisConfig.USE_TLS,
                            key: redisConfig.PRIVATE_KEY,
                            cert: redisConfig.CERTIFICATE_AUTHORITIES,
                        },
                    },
                ],
            });
        } else {
            redisClient = createClient({
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
        }

        /*
            Just retrying does not work.
            Once the connection has failed if no error handler is registered later connection attempts might just fail because
            the client library assumes termination of the process if failure
            Also the documentation expressly requires listening to on('error')
             */

        /* istanbul ignore next */
        await redisClient
            .on('error', (error: Error) => this.logger.error(`Redis connection failed: ${error.message}`))
            .connect();
        this.logger.info('Redis-connection made');

        const redisStore: RedisStore = new RedisStore({
            client: redisClient,
        });

        consumer
            .apply(
                session({
                    store: redisStore,
                    resave: false,
                    saveUninitialized: false,
                    rolling: true,
                    cookie: {
                        maxAge: this.configService.getOrThrow<FrontendConfig>('FRONTEND').SESSION_TTL_MS,
                        secure: this.configService.getOrThrow<FrontendConfig>('FRONTEND').SECURE_COOKIE,
                    },
                    secret: this.configService.getOrThrow<FrontendConfig>('FRONTEND').SESSION_SECRET,
                }),
                passport.initialize({ userProperty: 'passportUser' }),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                passport.session(),
                SessionAccessTokenMiddleware,
            )
            .forRoutes('*');
    }
}

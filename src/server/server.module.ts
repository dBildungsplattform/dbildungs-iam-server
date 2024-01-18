import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { defineConfig } from '@mikro-orm/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, loadConfigFiles, ServerConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/index.js';
import { PersonApiModule } from '../modules/person/person-api.module.js';
import { KeycloakAdministrationModule } from '../modules/keycloak-administration/keycloak-administration.module.js';
import { OrganisationApiModule } from '../modules/organisation/organisation-api.module.js';
import { AuthGuard, KeycloakConnectModule, RoleGuard } from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from '../modules/health/health.module.js';
import { RolleApiModule } from '../modules/rolle/rolle-api.module.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { ErrorModule } from '../shared/error/error.module.js';
import { KeycloakInstanceConfig } from '../modules/keycloak-administration/keycloak-instance-config.js';
import { KeycloakConfigModule } from '../modules/keycloak-administration/keycloak-config.module.js';

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
                    password: dbConfig.SECRET,
                    dbName: dbConfig.DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                    // Needed for HealthCheck
                    type: 'postgresql',
                    driverOptions: {
                        connection: {
                            ssl: dbConfig.USE_SSL,
                        },
                    },
                });
            },
            inject: [ConfigService],
        }),
        KeycloakConnectModule.registerAsync({
            useFactory: (config: KeycloakInstanceConfig) => {
                return {
                    authServerUrl: config.BASE_URL,
                    realm: config.REALM_NAME,
                    clientId: config.CLIENT_ID,
                    secret: config.CLIENT_SECRET,
                };
            },
            inject: [KeycloakInstanceConfig],
        }),
        LoggerModule.register(ServerModule.name),
        PersonApiModule,
        OrganisationApiModule,
        KeycloakAdministrationModule,
        HealthModule,
        RolleApiModule,
        ErrorModule,
        KeycloakConfigModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RoleGuard,
        },
    ],
})
export class ServerModule {}

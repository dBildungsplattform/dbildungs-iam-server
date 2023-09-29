import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, KeycloakConnectModule, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';

import { FrontendApiModule } from '../modules/frontend/frontend-api.module.js';
import { DbConfig, KeycloakConfig, ServerConfig, loadConfigFiles, loadEnvConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/mapping.error.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: loadEnvConfig,
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
                    dbName: dbConfig.DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                });
            },
            inject: [ConfigService],
        }),
        KeycloakConnectModule.registerAsync({
            useFactory: (config: ConfigService<ServerConfig, true>) => {
                const keycloakConfig: KeycloakConfig = config.getOrThrow<KeycloakConfig>('KEYCLOAK');

                return {
                    authServerUrl: keycloakConfig.BASE_URL,
                    realm: keycloakConfig.REALM_NAME,
                    clientId: keycloakConfig.CLIENT_ID,
                    secret: keycloakConfig.SECRET,
                };
            },
            inject: [ConfigService],
        }),
        FrontendApiModule,
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
        {
            provide: APP_GUARD,
            useClass: ResourceGuard,
        },
    ],
})
export class FrontendModule {}

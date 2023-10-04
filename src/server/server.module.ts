import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { defineConfig } from '@mikro-orm/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, loadConfigFiles, loadEnvConfig, ServerConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/index.js';
import { PersonApiModule } from '../modules/person/person-api.module.js';
import { HealthModule } from '../health/health.module.js';
import { KeycloakAdministrationModule } from '../modules/keycloak-administration/keycloak-administration.module.js';
import { OrganisationApiModule } from '../modules/organisation/organisation-api.module.js';

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
                    // Needed for HealthCheck
                    type: 'postgresql',
                });
            },
            inject: [ConfigService],
        }),
        PersonApiModule,
        OrganisationApiModule,
        KeycloakAdministrationModule,
        HealthModule,
    ],
})
export class ServerModule {}

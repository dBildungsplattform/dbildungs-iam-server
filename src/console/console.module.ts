import { CamelCaseNamingConvention } from '@automapper/core';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, loadConfigFiles, loadEnvConfig, ServerConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/index.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { DbSeedConsole } from './dbseed/db-seed.console.js';
import { KeycloakAdministrationModule } from '../modules/keycloak-administration/keycloak-administration.module.js';
import { UserModule } from '../modules/user/user.module.js';
import { UsernameGeneratorService } from '../modules/user/username-generator.service.js';
import { DbSeedMapper } from './dbseed/db-seed-mapper.js';
import { DbSeedService } from './dbseed/db-seed.service.js';

@Module({
    imports: [
        KeycloakAdministrationModule,
        UserModule,
        LoggerModule.register(ConsoleModule.name),
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
                return defineConfig({
                    clientUrl: config.getOrThrow<DbConfig>('DB').CLIENT_URL,
                    dbName: config.getOrThrow<DbConfig>('DB').DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                    driverOptions: {
                        connection: {
                            ssl: config.getOrThrow<DbConfig>('DB').USE_SSL,
                        },
                    },
                });
            },
            inject: [ConfigService],
        }),
    ],
    providers: [DbConsole, DbInitConsole, DbSeedConsole, UsernameGeneratorService, DbSeedMapper, DbSeedService],
})
export class ConsoleModule {}

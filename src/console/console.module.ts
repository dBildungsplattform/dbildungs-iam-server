import { CamelCaseNamingConvention } from '@automapper/core';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, loadConfigFiles, ServerConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/index.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { DbSeedConsole } from './dbseed/db-seed.console.js';
import { KeycloakAdministrationModule } from '../modules/keycloak-administration/keycloak-administration.module.js';
import { UsernameGeneratorService } from '../modules/person/domain/username-generator.service.js';
import { DbSeedMapper } from './dbseed/db-seed-mapper.js';
import { DbSeedService } from './dbseed/db-seed.service.js';
import { KeycloakConfigModule } from '../modules/keycloak-administration/keycloak-config.module.js';
import { PersonRepository } from '../modules/person/persistence/person.repository.js';
import { RolleSeedingRepo } from './dbseed/repo/rolle-seeding.repo.js';
import { PersonFactory } from '../modules/person/domain/person.factory.js';
import { DBiamPersonenkontextRepo } from '../modules/personenkontext/dbiam/dbiam-personenkontext.repo.js';

@Module({
    imports: [
        KeycloakConfigModule,
        KeycloakAdministrationModule,
        LoggerModule.register(ConsoleModule.name),
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
                return defineConfig({
                    clientUrl: config.getOrThrow<DbConfig>('DB').CLIENT_URL,
                    dbName: config.getOrThrow<DbConfig>('DB').DB_NAME,
                    password: config.getOrThrow<DbConfig>('DB').SECRET,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                    driverOptions: {
                        connection: {
                            ssl: config.getOrThrow<DbConfig>('DB').USE_SSL,
                        },
                    },
                    allowGlobalContext: true,
                    connect: false,
                });
            },
            inject: [ConfigService],
        }),
    ],
    providers: [
        DbConsole,
        DbInitConsole,
        DbSeedConsole,
        UsernameGeneratorService,
        DbSeedMapper,
        DbSeedService,
        PersonRepository,
        PersonFactory,
        PersonRepository,
        DBiamPersonenkontextRepo,
        RolleSeedingRepo,
    ],
})
export class ConsoleModule {}

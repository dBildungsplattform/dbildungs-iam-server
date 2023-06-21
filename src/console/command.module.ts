import { CamelCaseNamingConvention } from '@automapper/core';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, LoggingModule, MappingError, ServerConfig, loadConfig, validateConfig } from '../shared/index.js';
import { DbCommand } from './db.command.js';
import { DbInitCommand } from './db-init.command.js';

@Module({
    imports: [
        LoggingModule,
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateConfig,
            load: [loadConfig],
        }),
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
            namingConventions: new CamelCaseNamingConvention(),
            errorHandler: {
                handle: (error: unknown): void => {
                    throw new MappingError(error);
                },
            },
        }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigService<ServerConfig, true>) => {
                return defineConfig({
                    clientUrl: config.getOrThrow<DbConfig>('DB').CLIENT_URL,
                    dbName: config.getOrThrow<DbConfig>('DB').DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                });
            },
            inject: [ConfigService],
        }),
    ],
    providers: [DbCommand, DbInitCommand],
})
export class CommandModule {}

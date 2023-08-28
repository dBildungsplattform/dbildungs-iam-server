import { CamelCaseNamingConvention } from '@automapper/core';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, ServerConfig, loadConfigFiles, loadEnvConfig } from '../shared/config/index.js';
import { mappingErrorHandler } from '../shared/error/index.js';
import { LoggingModule } from '../shared/logging/index.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';

@Module({
    imports: [
        LoggingModule,
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
                });
            },
            inject: [ConfigService],
        }),
    ],
    providers: [DbConsole, DbInitConsole],
})
export class ConsoleModule {}

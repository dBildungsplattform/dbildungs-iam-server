import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { Module } from '@nestjs/common';
import { DbConfig, MappingError, JsonConfig, loadConfig, validateConfig } from './shared/index.js';
import { PersonApiModule } from './modules/person/person-api.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';

@Module({
    imports: [
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
            useFactory: (config: ConfigService<JsonConfig, true>) => {
                return defineConfig({
                    clientUrl: config.getOrThrow<DbConfig>('DB').CLIENT_URL,
                    dbName: config.getOrThrow<DbConfig>('DB').DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                });
            },
            inject: [ConfigService],
        }),
        PersonApiModule,
    ],
})
export class ServerModule {}

import { Module } from '@nestjs/common';
import { PersonApiModule } from './modules/person/person-api.module.js';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServerConfig, loadConfig } from './shared/config/server.config.js';
import { AppModule } from './app.module.js';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { DbConfig } from './shared/index.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadConfig],
        }),
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
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
        AppModule,
        PersonApiModule,
    ],
})
export class ServerModule {}

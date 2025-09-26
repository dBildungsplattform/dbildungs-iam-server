import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbConfig, loadEmailAppConfigFiles, ServerConfig } from '../shared/config/index.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { EmailHealthModule } from './modules/health/email-health.module.js';
import { EmailCoreModule } from './modules/core/email-core.module.js';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadEmailAppConfigFiles],
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
        LoggerModule.register(EmailModule.name),
        EmailHealthModule,
        EmailCoreModule,
    ],
})
export class EmailModule {}

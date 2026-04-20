import { Module } from '@nestjs/common';
import { DbConfig, EmailConfigModule } from '../shared/config/index.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { EmailHealthModule } from './modules/health/email-health.module.js';
import { EmailCoreModule } from './modules/core/email-core.module.js';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EmailAppConfig } from '../shared/config/email-app.config.js';
import { PassportModule } from '@nestjs/passport';
import { InternalCommunicationApiKeyStrategy } from './passport/internalcommunicationapikey.strategy.js';
import { EmailWebhookModule } from './modules/webhook/webhook.module.js';

@Module({
    imports: [
        EmailConfigModule,
        MikroOrmModule.forRootAsync({
            useFactory: (config: EmailAppConfig) => {
                const dbConfig: DbConfig = config.DB;
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
                    driver: PostgreSqlDriver,
                    connect: false,
                });
            },
            inject: [EmailAppConfig],
        }),
        PassportModule.register({
            defaultStrategy: ['api-key'],
            property: 'passportUser',
        }),
        LoggerModule.register(EmailModule.name),
        EmailHealthModule,
        EmailCoreModule,
        EmailWebhookModule,
    ],
    providers: [InternalCommunicationApiKeyStrategy],
})
export class EmailModule {}

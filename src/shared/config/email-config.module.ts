import { Global, Module } from '@nestjs/common';
import { ConfigFactoryKeyHost, ConfigModule, ConfigType, registerAs } from '@nestjs/config';

import { loadEmailAppConfigFiles } from './config.loader.js';
import { DbConfig } from './db.config.js';
import { EmailAppConfig } from './email-app.config.js';
import { LoggingConfig } from './logging.config.js';

type NamespacedConfig<C> = (() => C) & ConfigFactoryKeyHost<C>;

const emailConfig: NamespacedConfig<EmailAppConfig> = registerAs('email', () => loadEmailAppConfigFiles());

@Global()
@Module({
    imports: [ConfigModule.forFeature(emailConfig)],
    providers: [
        {
            provide: EmailAppConfig,
            useFactory: (config: ConfigType<typeof emailConfig>): EmailAppConfig => config,
            inject: [emailConfig.KEY],
        },
        {
            provide: LoggingConfig,
            useFactory: (config: ConfigType<typeof emailConfig>): LoggingConfig => config.LOGGING,
            inject: [emailConfig.KEY],
        },
        {
            provide: DbConfig,
            useFactory: (config: ConfigType<typeof emailConfig>): DbConfig => config.DB,
            inject: [emailConfig.KEY],
        },
    ],
    exports: [EmailAppConfig, LoggingConfig, DbConfig],
})
export class EmailConfigModule {}

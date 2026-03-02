import { Global, Module } from '@nestjs/common';
import { ConfigFactoryKeyHost, ConfigModule, ConfigType, registerAs } from '@nestjs/config';

import { loadConfigFiles } from './config.loader.js';
import { DbConfig } from './db.config.js';
import { JsonConfig } from './json.config.js';
import { LoggingConfig } from './logging.config.js';

type NamespacedConfig<C> = (() => C) & ConfigFactoryKeyHost<C>;

const serverConfig: NamespacedConfig<JsonConfig> = registerAs('server', () => loadConfigFiles());

@Global()
@Module({
    imports: [ConfigModule.forFeature(serverConfig)],
    providers: [
        {
            provide: JsonConfig,
            useFactory: (config: ConfigType<typeof serverConfig>): JsonConfig => config,
            inject: [serverConfig.KEY],
        },
        {
            provide: LoggingConfig,
            useFactory: (config: ConfigType<typeof serverConfig>): LoggingConfig => config.LOGGING,
            inject: [serverConfig.KEY],
        },
        {
            provide: DbConfig,
            useFactory: (config: ConfigType<typeof serverConfig>): DbConfig => config.DB,
            inject: [serverConfig.KEY],
        },
    ],
    exports: [JsonConfig, LoggingConfig, DbConfig],
})
export class ServerConfigModule {}

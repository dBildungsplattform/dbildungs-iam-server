import { readFileSync } from 'fs';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbConfig, JsonConfig } from '../../src/shared/config';
import { plainToInstance } from 'class-transformer';
import { LoggingConfig } from '../../src/shared/config/logging.config';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validatePredefined: false,
            skipProcessEnv: true,
            load: [
                (): Record<string, unknown> => {
                    return JSON.parse(readFileSync('./test/config.test.json', { encoding: 'utf-8' })) as Record<
                        string,
                        unknown
                    >;
                },
            ],
        }),
    ],
    providers: [
        {
            provide: JsonConfig,
            useValue: plainToInstance(
                JsonConfig,
                JSON.parse(readFileSync('./test/config.test.json', { encoding: 'utf-8' })),
            ),
        },
        {
            provide: LoggingConfig,
            useFactory: (config: JsonConfig): LoggingConfig => config.LOGGING,
            inject: [JsonConfig],
        },
        {
            provide: DbConfig,
            useFactory: (config: JsonConfig): DbConfig => config.DB,
            inject: [JsonConfig],
        },
    ],
    exports: [JsonConfig, LoggingConfig, DbConfig],
})
export class ConfigTestModule {}

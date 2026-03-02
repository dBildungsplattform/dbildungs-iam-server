import { Global, Module } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { readFileSync } from 'fs';

import { DbConfig, EmailAppConfig } from '../../src/shared/config';
import { LoggingConfig } from '../../src/shared/config/logging.config';

@Global()
@Module({
    providers: [
        {
            provide: EmailAppConfig,
            useValue: plainToInstance(
                EmailAppConfig,
                JSON.parse(readFileSync('./test/email-config.test.json', { encoding: 'utf-8' })),
            ),
        },
        {
            provide: LoggingConfig,
            useFactory: (config: EmailAppConfig): LoggingConfig => config.LOGGING,
            inject: [EmailAppConfig],
        },
        {
            provide: DbConfig,
            useFactory: (config: EmailAppConfig): DbConfig => config.DB,
            inject: [EmailAppConfig],
        },
    ],
    exports: [EmailAppConfig, LoggingConfig, DbConfig],
})
export class EmailConfigTestModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEmailAppConfigFiles } from '../shared/config/index.js';
import { LoggerModule } from '../core/logging/logger.module.js';
import { EmailHealthModule } from './modules/health/email-health.module.js';
import { EmailApiModule } from './modules/api/email-api.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadEmailAppConfigFiles],
        }),
        LoggerModule.register(EmailModule.name),
        EmailHealthModule,
        EmailApiModule,
    ],
})
export class EmailModule {}

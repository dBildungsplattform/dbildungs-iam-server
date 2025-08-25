import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEmailAppConfigFiles } from '../shared/config/index.js';
import { LoggerModule } from '../core/logging/logger.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadEmailAppConfigFiles],
        }),
        LoggerModule.register(EmailModule.name),
    ],
})
export class EmailModule {}

import { Module } from '@nestjs/common';
import { EmailInstanceConfig } from './email-instance-config.js';

@Module({
    providers: [EmailInstanceConfig.fromConfigService()],
    exports: [EmailInstanceConfig],
})
export class EmailConfigModule {}

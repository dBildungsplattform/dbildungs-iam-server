import { Module } from '@nestjs/common';
import { EmailRepo } from './persistence/email.repo.js';
import { EmailConfigModule } from './email-config.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [EmailConfigModule, LoggerModule.register(EmailPersistenceModule.name)],
    providers: [EmailRepo],
    exports: [EmailRepo],
})
export class EmailPersistenceModule {}

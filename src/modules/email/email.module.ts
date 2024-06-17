import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { EmailRepo } from './persistence/email.repo.js';
import { EmailFactory } from './domain/email.factory.js';
import { EmailGeneratorService } from './domain/email-generator.service.js';
import { EmailEventHandler } from './domain/email-event-handler.js';

@Module({
    imports: [LoggerModule.register(EmailModule.name)],
    providers: [EmailRepo, EmailFactory, EmailGeneratorService, EmailEventHandler],
    exports: [EmailRepo, EmailFactory, EmailGeneratorService, EmailEventHandler],
})
export class EmailModule {}

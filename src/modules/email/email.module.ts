import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { EmailRepo } from './persistence/email.repo.js';
import { EmailFactory } from './domain/email.factory.js';
import { EmailGeneratorService } from './domain/email-generator.service.js';
import { EmailEventHandler } from './domain/email-event-handler.js';
import { EmailServiceRepo } from './persistence/email-service.repo.js';
import { PersonModule } from '../person/person.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { EventModule } from '../../core/eventbus/event.module.js';

@Module({
    imports: [PersonModule, RolleModule, ServiceProviderModule, EventModule, LoggerModule.register(EmailModule.name)],
    providers: [EmailRepo, EmailServiceRepo, EmailFactory, EmailGeneratorService, EmailEventHandler],
    exports: [EmailRepo, EmailFactory, EmailGeneratorService, EmailEventHandler],
})
export class EmailModule {}

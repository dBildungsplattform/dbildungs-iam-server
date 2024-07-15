import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonModule } from '../person/person.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { EmailEventHandler } from './domain/email-event-handler.js';
import { EmailFactory } from './domain/email.factory.js';
import { EmailRepo } from './persistence/email.repo.js';

@Module({
    imports: [PersonModule, RolleModule, ServiceProviderModule, EventModule, LoggerModule.register(EmailModule.name)],
    providers: [EmailRepo, EmailFactory, EmailEventHandler],
    exports: [EmailRepo],
})
export class EmailModule {}

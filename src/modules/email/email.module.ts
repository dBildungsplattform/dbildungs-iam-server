import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonModule } from '../person/person.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { EmailEventHandler } from './domain/email-event-handler.js';
import { EmailFactory } from './domain/email.factory.js';
import { EmailRepo } from './persistence/email.repo.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { EmailConfigModule } from './email-config.module.js';
import { EmailResolverService } from './email-resolver-service/email-resolver.service.js';
import { HttpModule } from '@nestjs/axios';
import { EmailMicroserviceEventHandler } from './domain/email-microservice-event-handler.js';

@Module({
    imports: [
        HttpModule,
        EmailConfigModule,
        OrganisationModule,
        PersonModule,
        RolleModule,
        ServiceProviderModule,
        PersonenKontextModule,
        EventModule,
        LoggerModule.register(EmailModule.name),
    ],
    providers: [EmailRepo, EmailFactory, EmailEventHandler, EmailResolverService, EmailMicroserviceEventHandler],
    exports: [EmailRepo, EmailResolverService],
})
export class EmailModule {}

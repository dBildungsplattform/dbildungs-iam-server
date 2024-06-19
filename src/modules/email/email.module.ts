import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { EmailRepo } from './persistence/email.repo.js';
import { EmailFactory } from './domain/email.factory.js';
import { EmailGeneratorService } from './domain/email-generator.service.js';
import { EmailEventHandler } from './domain/email-event-handler.js';
import { RolleRepo } from '../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { RolleFactory } from '../rolle/domain/rolle.factory.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { PersonModule } from '../person/person.module.js';
import { EmailServiceRepo } from './persistence/email-service.repo.js';

@Module({
    imports: [PersonModule, LoggerModule.register(EmailModule.name)],
    providers: [
        RolleRepo,
        RolleFactory,
        ServiceProviderRepo,
        OrganisationRepository,
        EmailRepo,
        EmailServiceRepo,
        EmailFactory,
        EmailGeneratorService,
        EmailEventHandler,
    ],
    exports: [EmailRepo, EmailFactory, EmailGeneratorService, EmailEventHandler],
})
export class EmailModule {}

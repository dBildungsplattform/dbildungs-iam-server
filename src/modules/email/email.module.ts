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
import { EmailServiceRepo } from './persistence/email-service.repo.js';
import { EventService } from '../../core/eventbus/index.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import { KeycloakAdministrationService } from '../keycloak-administration/domain/keycloak-admin-client.service.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { EmailAddressRepo } from './persistence/email-address.repo.js';

@Module({
    imports: [KeycloakAdministrationModule, LoggerModule.register(EmailModule.name)],
    providers: [
        KeycloakUserService,
        KeycloakAdministrationService,
        KeycloakAdminClient,
        PersonRepository,
        RolleRepo,
        RolleFactory,
        ServiceProviderRepo,
        OrganisationRepository,
        EmailRepo,
        EmailAddressRepo,
        EmailServiceRepo,
        EmailFactory,
        EmailGeneratorService,
        EmailEventHandler,
        EventService,
    ],
    exports: [EmailRepo, EmailFactory, EmailGeneratorService, EmailEventHandler],
})
export class EmailModule {}

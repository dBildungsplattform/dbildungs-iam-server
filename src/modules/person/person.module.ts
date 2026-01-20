import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonService } from './domain/person.service.js';
import { UsernameGeneratorService } from './domain/username-generator.service.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonRepository } from './persistence/person.repository.js';
import { PersonFactory } from './domain/person.factory.js';
import { RolleRepo } from '../rolle/repo/rolle.repo.js';
import { RolleFactory } from '../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { OxUserBlacklistRepo } from './persistence/ox-user-blacklist.repo.js';
import PersonTimeLimitService from './domain/person-time-limit-info.service.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { EmailMicroserviceModule } from '../email-microservice/email-microservice.module.js';

@Module({
    imports: [
        KeycloakAdministrationModule,
        LoggerModule.register(PersonModule.name),
        EventModule,
        forwardRef(() => EmailMicroserviceModule),
        forwardRef(() => PersonenKontextModule),
    ],
    providers: [
        PersonRepository,
        PersonService,
        PersonFactory,
        UsernameGeneratorService,
        RolleRepo,
        OrganisationRepository,
        RolleFactory,
        ServiceProviderRepo,
        OxUserBlacklistRepo,
        PersonTimeLimitService,
    ],
    exports: [PersonService, PersonFactory, PersonRepository, PersonTimeLimitService],
})
export class PersonModule {}

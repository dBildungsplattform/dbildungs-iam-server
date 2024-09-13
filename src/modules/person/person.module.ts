import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonService } from './domain/person.service.js';
import { PersonRepo } from './persistence/person.repo.js';
import { UsernameGeneratorService } from './domain/username-generator.service.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonRepository } from './persistence/person.repository.js';
import { PersonFactory } from './domain/person.factory.js';
import { RolleRepo } from '../rolle/repo/rolle.repo.js';
import { RolleFactory } from '../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { PersonPersistenceMapperProfile } from './persistence/person-persistence.mapper.profile.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
@Module({
    imports: [KeycloakAdministrationModule, LoggerModule.register(PersonModule.name), OrganisationModule, EventModule],
    providers: [
        PersonRepo,
        PersonRepository,
        PersonService,
        PersonFactory,
        UsernameGeneratorService,
        RolleRepo,
        RolleFactory,
        ServiceProviderRepo,
        PersonPersistenceMapperProfile, //Remove this when PersonRepo is removed
    ],
    exports: [PersonService, PersonFactory, PersonRepo, PersonRepository],
})
export class PersonModule {}

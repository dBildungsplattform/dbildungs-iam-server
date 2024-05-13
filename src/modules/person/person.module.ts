import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonService } from './domain/person.service.js';
import { PersonPersistenceMapperProfile } from './persistence/person-persistence.mapper.profile.js';
import { PersonRepo } from './persistence/person.repo.js';
import { UsernameGeneratorService } from './domain/username-generator.service.js';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { KeycloakAdministrationService } from '../keycloak-administration/domain/keycloak-admin-client.service.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { PersonRepository } from './persistence/person.repository.js';
import { PersonFactory } from './domain/person.factory.js';
import { PersonUc } from './domain/person.uc.js';

@Module({
    imports: [KeycloakAdministrationModule, LoggerModule.register(PersonModule.name)],
    providers: [
        PersonPersistenceMapperProfile,
        PersonRepo,
        PersonRepository,
        PersonService,
        PersonUc,
        PersonFactory,
        UsernameGeneratorService,
        KeycloakUserService,
        KeycloakAdministrationService,
        KeycloakAdminClient,
    ],
    exports: [PersonService, PersonUc, PersonFactory, PersonRepo, PersonRepository],
})
export class PersonModule {}

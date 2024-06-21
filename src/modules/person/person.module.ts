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
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../personenkontext/domain/personenkontext.factory.js';
import { RolleRepo } from '../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../organisation/persistence/organisation.repo.js';
import { RolleFactory } from '../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { PersonenkontextWorkflowFactory } from '../personenkontext/domain/personenkontext-workflow.factory.js';
import { DbiamPersonenkontextFactory } from '../personenkontext/domain/dbiam-personenkontext.factory.js';

@Module({
    imports: [KeycloakAdministrationModule, LoggerModule.register(PersonModule.name)],
    providers: [
        PersonPersistenceMapperProfile,
        PersonRepo,
        PersonRepository,
        DBiamPersonenkontextRepo,
        DbiamPersonenkontextFactory,
        PersonService,
        PersonFactory,
        UsernameGeneratorService,
        KeycloakUserService,
        KeycloakAdministrationService,
        KeycloakAdminClient,
        PersonenkontextFactory,
        PersonenkontextWorkflowFactory,
        RolleRepo,
        OrganisationRepo,
        OrganisationRepository,
        RolleFactory,
        ServiceProviderRepo,
    ],
    exports: [PersonService, PersonFactory, PersonRepo, PersonRepository],
})
export class PersonModule {}

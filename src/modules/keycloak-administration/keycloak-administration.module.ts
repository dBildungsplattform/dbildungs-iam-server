import { Module } from '@nestjs/common';

import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationService } from './domain/keycloak-admin-client.service.js';
import { KeycloakUserService } from './domain/keycloak-user.service.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakConfigModule } from './keycloak-config.module.js';
import { KeycloakGroupRoleService } from './domain/keycloak-group-role.service.js';

import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { PersonRepository } from '../person/persistence/person.repository.js';

import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../personenkontext/domain/personenkontext.factory.js';
import { KeycloackServiceProviderHandler } from './event-handlers/keycloack-service-provider.event-handler.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { RolleModule } from '../rolle/rolle.module.js';

@Module({
    imports: [LoggerModule.register(KeycloakAdministrationModule.name), KeycloakConfigModule, EventModule, RolleModule],
    providers: [
        KeycloakAdminClient,
        KeycloakUserService,
        KeycloakGroupRoleService,
        KeycloakAdministrationService,

        OrganisationRepository,
        ServiceProviderRepo,
        PersonRepository,
        DBiamPersonenkontextRepo,
        PersonenkontextFactory,
        KeycloackServiceProviderHandler,
        eventhan,
    ],
    exports: [KeycloakUserService, KeycloakGroupRoleService],
})
export class KeycloakAdministrationModule {}

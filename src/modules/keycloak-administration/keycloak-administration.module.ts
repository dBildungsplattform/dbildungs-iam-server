import { Module } from '@nestjs/common';

import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationService } from './domain/keycloak-admin-client.service.js';
import { KeycloakUserService } from './domain/keycloak-user.service.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakConfigModule } from './keycloak-config.module.js';
import { KeycloakGroupRoleService } from './domain/keycloak-group-role.service.js';
import { KeyclockServiceProviderEventHandler } from './event-handlers/kc-service-provider.event-handler.js';
import { RolleRepo } from '../rolle/repo/rolle.repo.js';
import { RolleFactory } from '../rolle/domain/rolle.factory.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';

@Module({
    imports: [LoggerModule.register(KeycloakAdministrationModule.name), KeycloakConfigModule],
    providers: [
        KeycloakAdminClient,
        KeycloakUserService,
        KeycloakGroupRoleService,
        KeycloakAdministrationService,
        KeyclockServiceProviderEventHandler,
        RolleRepo,
        RolleFactory,
        OrganisationRepository,
        ServiceProviderRepo,
    ],
    exports: [KeycloakUserService, KeycloakGroupRoleService],
})
export class KeycloakAdministrationModule {}

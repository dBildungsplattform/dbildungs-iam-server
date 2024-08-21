import { Module } from '@nestjs/common';

import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';

import { KeycloakUserService } from './domain/keycloak-user.service.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakConfigModule } from './keycloak-config.module.js';
import { KeycloakGroupRoleService } from './domain/keycloak-group-role.service.js';

import { KeycloakAdministrationService } from './domain/keycloak-admin-client.service.js';
import { CreateGroupAndRoleHandler } from '../service-provider/repo/service-provider-event-handler.js';
@Module({
    imports: [LoggerModule.register(KeycloakAdministrationModule.name), KeycloakConfigModule],
    providers: [
        KeycloakAdminClient,
        KeycloakUserService,
        KeycloakGroupRoleService,
        KeycloakAdministrationService,
        CreateGroupAndRoleHandler,
    ],
    exports: [KeycloakUserService, KeycloakGroupRoleService],
})
export class KeycloakAdministrationModule {}

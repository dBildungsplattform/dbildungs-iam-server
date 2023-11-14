import { Module } from '@nestjs/common';

import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationService } from './domain/keycloak-admin-client.service.js';
import { UserMapperProfile } from './domain/keycloak-client/user.mapper.profile.js';
import { KeycloakUserService } from './domain/keycloak-user.service.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonModule } from '../person/person.module.js';

@Module({
    imports: [LoggerModule.register(KeycloakAdministrationModule.name), PersonModule],
    providers: [UserMapperProfile, KeycloakAdminClient, KeycloakUserService, KeycloakAdministrationService],
    exports: [KeycloakUserService],
})
export class KeycloakAdministrationModule {}

import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { ServiceProviderFactory } from './domain/service-provider.factory.js';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { KeycloakAdministrationService } from '../keycloak-administration/domain/keycloak-admin-client.service.js';
import { CreateGroupAndRoleHandler } from './repo/service-provider-event-handler.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name), KeycloakAdministrationModule],
    providers: [
        ServiceProviderRepo,
        ServiceProviderFactory,
        KeycloakUserService,
        KeycloakAdministrationService,
        CreateGroupAndRoleHandler,
    ],
    exports: [ServiceProviderRepo, ServiceProviderFactory, KeycloakUserService, CreateGroupAndRoleHandler],
})
export class ServiceProviderModule {}

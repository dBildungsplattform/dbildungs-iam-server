import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { ServiceProviderFactory } from './domain/service-provider.factory.js';

import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';

import { CreateGroupAndRoleHandler } from './repo/service-provider-event-handler.js';
import { EventModule } from '../../core/eventbus/event.module.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name), KeycloakAdministrationModule, EventModule],
    providers: [ServiceProviderRepo, ServiceProviderFactory, CreateGroupAndRoleHandler],
    exports: [ServiceProviderRepo, ServiceProviderFactory],
})
export class ServiceProviderModule {}

import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { ServiceProviderFactory } from './domain/service-provider.factory.js';
import { EventModule } from '../../core/eventbus/index.js';

//import { CreateGroupAndRoleHandler } from './repo/service-provider-event-handler.js';
//import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
//import { KeycloakHandlerModule } from '../keycloak-handler/keycloak-handler.module.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name), EventModule],
    providers: [ServiceProviderRepo, ServiceProviderFactory],
    exports: [ServiceProviderRepo, ServiceProviderFactory],
})
export class ServiceProviderModule {}

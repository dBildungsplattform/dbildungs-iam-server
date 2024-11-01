import { forwardRef, Module } from '@nestjs/common';
import { EventModule } from '../../core/eventbus/event.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { ServiceProviderFactory } from './domain/service-provider.factory.js';
import { ServiceProviderService } from './domain/service-provider.service.js';
import { CreateGroupAndRoleHandler } from './repo/service-provider-event-handler.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';

@Module({
    imports: [
        LoggerModule.register(ServiceProviderModule.name),
        KeycloakAdministrationModule,
        EventModule,
        forwardRef(() => RolleModule),
    ],
    providers: [ServiceProviderRepo, ServiceProviderFactory, ServiceProviderService, CreateGroupAndRoleHandler],
    exports: [ServiceProviderRepo, ServiceProviderFactory, ServiceProviderService],
})
export class ServiceProviderModule {}

import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ProviderController } from './api/provider.controller.js';
import { ServiceProviderModule } from './service-provider.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { StreamableFileFactory } from '../../shared/util/streamable-file.factory.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { PersonModule } from '../person/person.module.js';
import { ServiceProviderService } from './domain/service-provider.service.js';

@Module({
    imports: [
        ServiceProviderModule,
        LoggerModule.register(ServiceProviderApiModule.name),
        PersonenKontextModule,
        KeycloakAdministrationModule,
        RolleModule,
        PersonModule,
    ],
    providers: [StreamableFileFactory, ServiceProviderService],
    exports: [ServiceProviderService],
    controllers: [ProviderController],
})
export class ServiceProviderApiModule {}

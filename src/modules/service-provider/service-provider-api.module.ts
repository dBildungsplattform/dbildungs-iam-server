import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ProviderController } from './api/provider.controller.js';
import { ServiceProviderModule } from './service-provider.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { StreamableFileFactory } from '../../shared/util/streamable-file.factory.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';

@Module({
    imports: [
        ServiceProviderModule,
        LoggerModule.register(ServiceProviderApiModule.name),
        PersonenKontextModule,
        forwardRef(() => RolleModule),
        forwardRef(() => OrganisationModule),
        KeycloakAdministrationModule,
    ],
    providers: [StreamableFileFactory],
    controllers: [ProviderController],
})
export class ServiceProviderApiModule {}

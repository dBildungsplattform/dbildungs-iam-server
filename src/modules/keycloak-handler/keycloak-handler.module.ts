import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakConfigModule } from '../keycloak-administration/keycloak-config.module.js';
import { EventModule } from '../../core/eventbus/event.module.js';
//import { RolleModule } from '../rolle/rolle.module.js';
import { PersonModule } from '../person/person.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
//import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { KeycloackServiceProviderHandler } from './keycloack-service-provider.event-handler.js';
import { RolleModule } from '../rolle/rolle.module.js';

@Module({
    imports: [
        LoggerModule.register(KeycloakHandlerModule.name),
        EventModule,
        PersonModule,
        ServiceProviderModule,
        RolleModule,
        EventModule,
        KeycloakConfigModule,
        KeycloakAdministrationModule,
    ],
    providers: [KeycloackServiceProviderHandler],
    exports: [KeycloackServiceProviderHandler],
})
export class KeycloakHandlerModule {}

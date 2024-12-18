import { Module } from '@nestjs/common';
import { CronController } from './cron.controller.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonModule } from '../person/person.module.js';
import { PersonDeleteModule } from '../person/person-deletion/person-delete.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';

@Module({
    imports: [
        PersonModule,
        PersonenKontextModule,
        KeycloakAdministrationModule,
        PersonDeleteModule,
        LoggerModule.register(CronModule.name),
        ServiceProviderModule,
    ],
    controllers: [CronController],
})
export class CronModule {}

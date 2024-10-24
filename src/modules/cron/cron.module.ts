import { Module } from '@nestjs/common';
import { CronController } from './cron.controller.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonModule } from '../person/person.module.js';
import { PersonDeleteModule } from '../person/person-deletion/person-delete.module.js';

@Module({
    imports: [PersonModule, KeycloakAdministrationModule, PersonDeleteModule],
    controllers: [CronController],
})
export class CronModule {}

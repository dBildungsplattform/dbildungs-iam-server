import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CronController } from './cron.controller.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonModule } from '../person/person.module.js';

@Module({
    imports: [HttpModule, PersonModule, KeycloakAdministrationModule],
    controllers: [CronController],
})
export class CronModule {}

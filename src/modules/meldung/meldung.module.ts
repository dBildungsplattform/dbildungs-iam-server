import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { MeldungRepo } from './persistence/meldung.repo.js';
import { MeldungController } from './api/meldung.controller.js';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule, LoggerModule.register(MeldungModule.name), KeycloakAdministrationModule],
    providers: [MeldungRepo],
    controllers: [MeldungController],
})
export class MeldungModule {}

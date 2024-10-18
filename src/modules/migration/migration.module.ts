import { Module } from '@nestjs/common';

import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { MigrationController } from './api/migration.controller.js';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(MigrationModule.name), KeycloakAdministrationModule],
    controllers: [MigrationController],
})
export class MigrationModule {}

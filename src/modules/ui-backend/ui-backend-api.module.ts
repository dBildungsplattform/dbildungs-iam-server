import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { LoginController } from './api/login.controller.js';
import { LoginService } from './domain/login.service.js';
import { NewLoginService } from './domain/new-login.service.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [LoggerModule.register(UiBackendApiModule.name)],
    providers: [KeycloakAdminClient, ConfigService, LoginService, NewLoginService],
    controllers: [LoginController],
})
export class UiBackendApiModule {}

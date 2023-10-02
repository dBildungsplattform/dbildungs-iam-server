import { Module } from '@nestjs/common';
import { LoginController } from './api/login.controller.js';
import { LoginService } from './domain/login.service.js';
import { NewLoginService } from './domain/new-login.service.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';

@Module({
    imports: [],
    providers: [KeycloakAdminClient, LoginService, NewLoginService],
    controllers: [LoginController],
})
export class UiBackendApiModule {}

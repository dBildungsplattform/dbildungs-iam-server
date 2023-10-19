import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HttpModule } from '@nestjs/axios';
import { UiBackendApiModule } from '../ui-backend/ui-backend-api.module.js';
import { KeycloakHealthIndictor } from './keycloak.health-indicator.js';

@Module({
    imports: [TerminusModule, HttpModule, UiBackendApiModule],
    providers: [KeycloakHealthIndictor],
    controllers: [HealthController],
})
export class HealthModule {}

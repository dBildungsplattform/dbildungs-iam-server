import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HttpModule } from '@nestjs/axios';
import { UiBackendApiModule } from '../ui-backend/ui-backend-api.module.js';
import { KeycloakHealthIndicator } from './keycloak.health-indicator.js';

@Module({
    imports: [TerminusModule, HttpModule, UiBackendApiModule],
    providers: [KeycloakHealthIndicator],
    controllers: [HealthController],
})
export class HealthModule {}

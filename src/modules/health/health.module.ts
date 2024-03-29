import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { KeycloakHealthIndicator } from './keycloak.health-indicator.js';
import { RedisHealthIndicator } from './redis.health-indicator.js';

@Module({
    imports: [TerminusModule, HttpModule, LoggerModule.register(HealthModule.name)],
    providers: [KeycloakHealthIndicator, RedisHealthIndicator],
    controllers: [HealthController],
})
export class HealthModule {}

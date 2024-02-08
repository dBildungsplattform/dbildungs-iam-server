import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HealthIndicatorResult,
    MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { EntityManager } from '@mikro-orm/postgresql';
import { ApiExcludeController } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';
import { KeycloakHealthIndicator } from './keycloak.health-indicator.js';
import { RedisHealthIndicator } from './redis.health-indicator.js';

@Controller('health')
@Unprotected()
@ApiExcludeController()
export class HealthController {
    public constructor(
        private health: HealthCheckService,
        private mikroOrm: MikroOrmHealthIndicator,
        private em: EntityManager,
        private keycloak: KeycloakHealthIndicator,
        private redis: RedisHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            (): Promise<HealthIndicatorResult> =>
                this.mikroOrm.pingCheck('database', { connection: this.em.getConnection() }),
            (): Promise<HealthIndicatorResult> => this.keycloak.check(),
            (): Promise<HealthIndicatorResult> => this.redis.check(),
        ]);
    }
}

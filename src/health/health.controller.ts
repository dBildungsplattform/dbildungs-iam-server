import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HealthIndicatorResult,
    HttpHealthIndicator,
    MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { EntityManager } from '@mikro-orm/postgresql';
import { KeycloakConfig } from '../shared/config/index.js';

@Controller('health')
export class HealthController {
    public constructor(
        private health: HealthCheckService,
        private mikroOrm: MikroOrmHealthIndicator,
        private http: HttpHealthIndicator,
        private em: EntityManager,
        private keycloakConfig: KeycloakConfig,
    ) {}

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        const baseUrl: string = this.keycloakConfig.BASE_URL;
        return this.health.check([
            (): Promise<HealthIndicatorResult> =>
                this.mikroOrm.pingCheck('database', { connection: this.em.getConnection() }),
            (): Promise<HealthIndicatorResult> => this.http.pingCheck('keycloak', baseUrl),
        ]);
    }
}

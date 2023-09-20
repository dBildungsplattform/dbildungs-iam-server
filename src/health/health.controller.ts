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
import { ConfigService } from '@nestjs/config';
import { KeycloakConfig } from '../shared/config/index.js';

@Controller('health')
export class HealthController {
    public constructor(
        private health: HealthCheckService,
        private mikroOrm: MikroOrmHealthIndicator,
        private http: HttpHealthIndicator,
        private em: EntityManager,
        private configService: ConfigService,
    ) {}

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        const keycloakConfig: KeycloakConfig = this.configService.getOrThrow<KeycloakConfig>('KEYCLOAK');
        const baseUrl: string = keycloakConfig.BASE_URL;
        return this.health.check([
            (): Promise<HealthIndicatorResult> =>
                this.mikroOrm.pingCheck('database', { connection: this.em.getConnection() }),
            (): Promise<HealthIndicatorResult> => this.http.pingCheck('keycloak', baseUrl),
        ]);
    }
}

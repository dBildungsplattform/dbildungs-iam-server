import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import {
    HealthCheckService,
    HealthIndicatorFunction,
    HealthIndicatorResult,
    HttpHealthIndicator,
    MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { KeycloakConfig } from '../../shared/config/index.js';

describe('HealthController', () => {
    let controller: HealthController;

    let healthCheckService: DeepMocked<HealthCheckService>;
    let mikroOrmHealthIndicator: MikroOrmHealthIndicator;
    let entityManager: SqlEntityManager;
    let httpHealthIndicator: DeepMocked<HttpHealthIndicator>;
    const keycloakConfig: KeycloakConfig = {
        ADMIN_CLIENT_ID: '',
        ADMIN_SECRET: '',
        ADMIN_REALM_NAME: '',
        BASE_URL: 'http://keycloak.test',
        REALM_NAME: '',
        CLIENT_ID: '',
        CLIENT_SECRET: '',
    };
    let configService: DeepMocked<ConfigService>;

    beforeEach(async () => {
        healthCheckService = createMock<HealthCheckService>();
        mikroOrmHealthIndicator = createMock<MikroOrmHealthIndicator>();
        entityManager = createMock<SqlEntityManager>();
        httpHealthIndicator = createMock<HttpHealthIndicator>();
        configService = createMock<ConfigService>();

        configService.getOrThrow.mockReturnValue(keycloakConfig);

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: HealthCheckService, useValue: healthCheckService },
                { provide: MikroOrmHealthIndicator, useValue: mikroOrmHealthIndicator },
                { provide: SqlEntityManager, useValue: entityManager },
                { provide: HttpHealthIndicator, useValue: httpHealthIndicator },
                { provide: KeycloakConfig, useValue: keycloakConfig },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should Perform all health checks', async () => {
        await controller.check();

        expect(healthCheckService.check).toHaveBeenCalled();
        const indicators: HealthIndicatorFunction[] | undefined = healthCheckService.check.mock.lastCall?.[0];
        const firstIndicator: (() => PromiseLike<HealthIndicatorResult> | HealthIndicatorResult) | undefined =
            indicators?.[0];
        expect(firstIndicator).toBeDefined();
        // Explanation: We get back the lambdas that the HealthCheck would call and call them
        // ourselves to make sure they do the right things
        await firstIndicator?.call(firstIndicator);
        expect(mikroOrmHealthIndicator.pingCheck).toHaveBeenCalled();
    });
});

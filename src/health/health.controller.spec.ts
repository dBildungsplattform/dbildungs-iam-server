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
import { KeycloakConfig } from '../shared/config/index.js';

describe('HealthController', () => {
    let controller: HealthController;

    let healthCheckService: DeepMocked<HealthCheckService>;
    let mikroOrmHealthIndicator: MikroOrmHealthIndicator;
    let entityManager: SqlEntityManager;
    let httpHealthIndicator: DeepMocked<HttpHealthIndicator>;
    const keycloakConfig: KeycloakConfig = {
        CLIENT_ID: '',
        PASSWORD: '',
        REALM_NAME: '',
        USERNAME: '',
        BASE_URL: 'http://keycloak.test',
    };
    beforeEach(async () => {
        healthCheckService = createMock<HealthCheckService>();
        mikroOrmHealthIndicator = createMock<MikroOrmHealthIndicator>();
        entityManager = createMock<SqlEntityManager>();
        httpHealthIndicator = createMock<HttpHealthIndicator>();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: HealthCheckService, useValue: healthCheckService },
                { provide: MikroOrmHealthIndicator, useValue: mikroOrmHealthIndicator },
                { provide: SqlEntityManager, useValue: entityManager },
                { provide: HttpHealthIndicator, useValue: httpHealthIndicator },
                { provide: KeycloakConfig, useValue: keycloakConfig },
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

        const secondIndicator: (() => PromiseLike<HealthIndicatorResult> | HealthIndicatorResult) | undefined =
            indicators?.[1];
        expect(secondIndicator).toBeDefined();
        await secondIndicator?.call(secondIndicator);

        expect(httpHealthIndicator.pingCheck).toHaveBeenCalled();
        expect(httpHealthIndicator.pingCheck).toBeCalledWith('keycloak', 'http://keycloak.test');
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthCheckService, HttpHealthIndicator, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { KeycloakConfig } from '../../shared/config/index.js';
import { KeycloakHealthIndictor } from './keycloak.health-indicator.js';

describe('HealthController', () => {
    let controller: HealthController;

    let healthCheckService: DeepMocked<HealthCheckService>;
    let mikroOrmHealthIndicator: MikroOrmHealthIndicator;
    let entityManager: SqlEntityManager;
    let httpHealthIndicator: DeepMocked<HttpHealthIndicator>;
    let keycloakHealthIndicator: DeepMocked<KeycloakHealthIndictor>;
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
        keycloakHealthIndicator = createMock<KeycloakHealthIndictor>();

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
                { provide: KeycloakHealthIndictor, useValue: keycloakHealthIndicator },
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
        expect(healthCheckService.check.mock.lastCall![0]).toBeDefined();

        await Promise.all(healthCheckService.check.mock.lastCall![0].map((hif) => hif.call(hif)));

        expect(mikroOrmHealthIndicator.pingCheck).toHaveBeenCalled();
        expect(keycloakHealthIndicator.check).toHaveBeenCalled();
    });
});

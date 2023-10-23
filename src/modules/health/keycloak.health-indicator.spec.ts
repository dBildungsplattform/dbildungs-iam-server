import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from '../ui-backend/domain/login.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BaseClient } from 'openid-client';
import { KeycloakHealthIndicator } from './keycloak.health-indicator.js';
import { HealthIndicatorResult, HealthIndicatorStatus } from '@nestjs/terminus';

describe('Keycloak health indicator', () => {
    const loginService: DeepMocked<LoginService> = createMock<LoginService>();
    let module: TestingModule;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: LoginService,
                    useValue: loginService,
                },
                KeycloakHealthIndicator,
            ],
        }).compile();
    });

    it('should report a successful acquisition of a KC-Client as the service being up', async () => {
        loginService.createKcClient.mockResolvedValueOnce(createMock<BaseClient>());

        const kchi: KeycloakHealthIndicator = module.get<KeycloakHealthIndicator>(KeycloakHealthIndicator);

        const checkResult: HealthIndicatorResult = await kchi.check();
        expect(checkResult['Keycloak']).toBeDefined();
        expect(checkResult['Keycloak']?.status).toBe('up');
    });

    it('should report a failed acquisition of a KC-Client as the service being down and showing the error message in the status', async () => {
        loginService.createKcClient.mockRejectedValueOnce(new Error('Because reasons'));

        const kchi: KeycloakHealthIndicator = module.get<KeycloakHealthIndicator>(KeycloakHealthIndicator);

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await kchi
            .check()
            .then((r: HealthIndicatorResult) => r['Keycloak']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe('Keycloak does not seem to be up: Because reasons');
    });

    it('should report a failed acquisition of a KC-Client as the service being down and showing the error message in the status', async () => {
        loginService.createKcClient.mockRejectedValueOnce({});

        const kchi: KeycloakHealthIndicator = module.get<KeycloakHealthIndicator>(KeycloakHealthIndicator);

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await kchi
            .check()
            .then((r: HealthIndicatorResult) => r['Keycloak']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe(
            'Keycloak does not seem to be up and there is no error message available',
        );
    });
});

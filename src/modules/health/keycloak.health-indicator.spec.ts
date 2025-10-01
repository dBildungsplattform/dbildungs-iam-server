import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { BaseClient } from 'openid-client';
import { KeycloakHealthIndicator } from './keycloak.health-indicator.js';
import { HealthIndicatorResult, HealthIndicatorStatus } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../shared/config/index.js';
import { ConfigTestModule, KeycloakConfigTestModule } from '../../../test/utils/index.js';

let error: Error | string | undefined = undefined;

jest.mock('../authentication/services/oidc-client.service.js', () => {
    return {
        tryGetClient: function (): Promise<BaseClient> {
            if (error === undefined) {
                return Promise.resolve(createMock<BaseClient>());
            } else {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(error);
            }
        },
    };
});

describe('Keycloak health indicator', () => {
    let module: TestingModule;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [KeycloakConfigTestModule.forRoot(), ConfigTestModule],
            providers: [
                KeycloakHealthIndicator,
                {
                    provide: ConfigService<ServerConfig>,
                    useValue: createMock<ConfigService<ServerConfig>>(),
                },
            ],
        }).compile();
    });

    it('should report a successful acquisition of a KC-Client as the service being up', async () => {
        const kchi: KeycloakHealthIndicator = module.get<KeycloakHealthIndicator>(KeycloakHealthIndicator);

        const checkResult: HealthIndicatorResult = await kchi.check();
        expect(checkResult['Keycloak']).toBeDefined();
        expect(checkResult['Keycloak']?.status).toBe('up');
    });

    it('should report a failed acquisition of a KC-Client as the service being down and showing the error message in the status', async () => {
        error = new Error('Because reasons');
        const kchi: KeycloakHealthIndicator = module.get<KeycloakHealthIndicator>(KeycloakHealthIndicator);

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await kchi
            .check()
            .then((r: HealthIndicatorResult) => r['Keycloak']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe('Keycloak does not seem to be up: Because reasons');
        error = undefined;
    });

    it('should report a failed acquisition of a KC-Client as the service being down and indicating that there is no error message', async () => {
        error = 'something horrible happened';
        const kchi: KeycloakHealthIndicator = module.get<KeycloakHealthIndicator>(KeycloakHealthIndicator);

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await kchi
            .check()
            .then((r: HealthIndicatorResult) => r['Keycloak']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe(
            'Keycloak does not seem to be up and there is no error message available',
        );
        error = undefined;
    });
});

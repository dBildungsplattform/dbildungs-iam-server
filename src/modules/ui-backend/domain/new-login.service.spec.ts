import { Test, TestingModule } from '@nestjs/testing';
import { Issuer } from 'openid-client';
import { NewLoginService } from './new-login.service.js';
import { ConfigTestModule } from '../../../../test/utils/index.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeycloakClientError, UserAuthenticationFailedError } from '../../../shared/error/index.js';

const issuerDiscoverMock: jest.Mock = jest.fn();
Issuer.discover = issuerDiscoverMock;

describe('SomeService', () => {
    let module: TestingModule;
    let someService: NewLoginService;
    let kcAdminClient: DeepMocked<KeycloakAdminClient>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                NewLoginService,
                {
                    provide: KeycloakAdminClient,
                    useValue: createMock<KeycloakAdminClient>(),
                },
            ],
        }).compile();
        someService = module.get(NewLoginService);
        kcAdminClient = module.get(KeycloakAdminClient);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('should execute getTokenForUser', () => {
        it('expect no exceptions when Keycloak is mocked', async () => {
            kcAdminClient.getAccessToken.mockResolvedValueOnce(Promise.resolve('thisIsATokenString'));
            const result: Result<string, Error> = await someService.auth('test', 'pass');
            expect(result).toStrictEqual<Result<string>>({
                ok: true,
                value: 'thisIsATokenString',
            });
            await someService.auth('user', 'password');
            expect(kcAdminClient.auth).toHaveBeenCalledTimes(2);
        });
    });

    describe('should execute getTokenForUser', () => {
        it('expect exception when auth() fails', async () => {
            kcAdminClient.auth.mockRejectedValueOnce(KeycloakClientError);
            const result: Result<string, Error> = await someService.auth('test', 'pass');
            expect(result).toStrictEqual<Result<UserAuthenticationFailedError>>({
                ok: false,
                error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
            });
            expect(kcAdminClient.auth).toHaveBeenCalledTimes(1);
        });

        it('expect exception for accessToken === undefined', async () => {
            kcAdminClient.auth.mockImplementationOnce(() => Promise.resolve());
            kcAdminClient.getAccessToken.mockResolvedValueOnce(Promise.resolve(undefined));
            const result: Result<string, Error> = await someService.auth('test', 'pass');
            expect(result).toStrictEqual<Result<UserAuthenticationFailedError>>({
                ok: false,
                error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
            });
            expect(kcAdminClient.auth).toHaveBeenCalledTimes(1);
        });

        it('expect exception when getAccessToken throws exception', async () => {
            kcAdminClient.auth.mockImplementationOnce(() => Promise.resolve());
            kcAdminClient.getAccessToken.mockRejectedValueOnce(Promise.resolve('test'));
            const result: Result<string, Error> = await someService.auth('test', 'pass');
            expect(result).toStrictEqual<Result<UserAuthenticationFailedError>>({
                ok: false,
                error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
            });
            expect(kcAdminClient.auth).toHaveBeenCalledTimes(1);
        });
    });
});

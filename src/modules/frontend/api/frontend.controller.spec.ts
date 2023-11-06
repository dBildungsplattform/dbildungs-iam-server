import { faker } from '@faker-js/faker/';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
import { Client, EndSessionParameters, IssuerMetadata, UserinfoResponse } from 'openid-client';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { FrontendConfig } from '../../../shared/config/frontend.config.js';
import { OIDC_CLIENT } from '../auth/oidc-client.service.js';
import { User } from '../auth/user.decorator.js';
import { ProviderService } from '../outbound/provider.service.js';
import { FrontendController } from './frontend.controller.js';
import { GetServiceProviderInfoDo } from '../../rolle/domain/get-service-provider-info.do.js';

describe('FrontendController', () => {
    let module: TestingModule;
    let frontendController: FrontendController;
    let oidcClient: DeepMocked<Client>;
    let frontendConfig: FrontendConfig;
    let providerService: DeepMocked<ProviderService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                FrontendController,
                { provide: ProviderService, useValue: createMock<ProviderService>() },
                { provide: OIDC_CLIENT, useValue: createMock<Client>() },
            ],
        }).compile();

        frontendController = module.get(FrontendController);
        oidcClient = module.get(OIDC_CLIENT);
        providerService = module.get(ProviderService);
        frontendConfig = module.get(ConfigService).getOrThrow<FrontendConfig>('FRONTEND');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(frontendController).toBeDefined();
    });

    describe('Login', () => {
        it('should redirect', () => {
            const responseMock: Response = createMock<Response>();
            const session: SessionData = { cookie: { originalMaxAge: 0 } };

            frontendController.login(responseMock, session);

            expect(responseMock.redirect).toHaveBeenCalled();
        });

        it('should redirect to saved redirectUrl', () => {
            const responseMock: Response = createMock<Response>();
            const sessionMock: SessionData = createMock<SessionData>({ redirectUrl: faker.internet.url() });

            frontendController.login(responseMock, sessionMock);

            expect(responseMock.redirect).toHaveBeenCalledWith(sessionMock.redirectUrl);
        });

        it('should clear redirectUrl from session', () => {
            const responseMock: Response = createMock<Response>();
            const session: SessionData = { redirectUrl: faker.internet.url(), cookie: { originalMaxAge: 0 } };

            frontendController.login(responseMock, session);

            expect(session.redirectUrl).toBeUndefined();
        });
    });

    describe('Logout', () => {
        function setupRequest(user?: User, logoutErr?: Error, destroyErr?: Error): Request {
            const sessionMock: DeepMocked<Session> = createMock<Session>();
            const requestMock: DeepMocked<Request> = createMock<Request>({
                session: sessionMock,
                user,
            });
            requestMock.logout.mockImplementationOnce((cb: (err: unknown) => void): void => {
                cb(logoutErr);
            });
            sessionMock.destroy.mockImplementationOnce((cb: (err: unknown) => void): Session => {
                cb(destroyErr);
                return sessionMock;
            });

            return requestMock;
        }

        it('should call request.logout', () => {
            const requestMock: Request = setupRequest();
            oidcClient.issuer.metadata = createMock<IssuerMetadata>({});

            frontendController.logout(requestMock, createMock());

            expect(requestMock.logout).toHaveBeenCalled();
        });

        it('should call session.destroy', () => {
            const requestMock: Request = setupRequest();
            oidcClient.issuer.metadata = createMock<IssuerMetadata>({});

            frontendController.logout(requestMock, createMock());

            expect(requestMock.logout).toHaveBeenCalled();
        });

        describe('when end_session_endpoint is defined', () => {
            it('should call endSessionUrl with correct params', () => {
                const user: User = createMock<User>({ id_token: faker.string.alphanumeric(32) });
                const requestMock: Request = setupRequest(user);
                oidcClient.issuer.metadata = createMock<IssuerMetadata>({ end_session_endpoint: faker.internet.url() });

                frontendController.logout(requestMock, createMock());

                expect(oidcClient.endSessionUrl).toHaveBeenCalledWith<[EndSessionParameters]>({
                    id_token_hint: user.id_token,
                    post_logout_redirect_uri: frontendConfig.LOGOUT_REDIRECT,
                    client_id: oidcClient.metadata.client_id,
                });
            });

            it('should redirect to return value of endSessionUrl', () => {
                const user: User = createMock<User>({ id_token: faker.string.alphanumeric(32) });
                const requestMock: Request = setupRequest(user);
                const responseMock: Response = createMock<Response>();
                oidcClient.issuer.metadata = createMock<IssuerMetadata>({ end_session_endpoint: faker.internet.url() });
                const endSessionUrl: string = faker.internet.url();
                oidcClient.endSessionUrl.mockReturnValueOnce(endSessionUrl);

                frontendController.logout(requestMock, responseMock);

                expect(responseMock.redirect).toHaveBeenCalledWith(endSessionUrl);
            });
        });

        describe('when end_session_endpoint is not defined', () => {
            it('should return to redirectUrl param', () => {
                const requestMock: Request = setupRequest();
                const responseMock: Response = createMock<Response>();
                oidcClient.issuer.metadata = createMock<IssuerMetadata>({ end_session_endpoint: undefined });

                frontendController.logout(requestMock, responseMock);

                expect(responseMock.redirect).toHaveBeenCalledWith(frontendConfig.LOGOUT_REDIRECT);
            });
        });

        describe('when request.logout fails', () => {
            it('should not throw error', () => {
                const requestMock: Request = setupRequest(undefined, new Error());

                expect(() => frontendController.logout(requestMock, createMock())).not.toThrow();
            });
        });

        describe('when session.destroy fails', () => {
            it('should not throw error', () => {
                const requestMock: Request = setupRequest(undefined, undefined, new Error());

                expect(() => frontendController.logout(requestMock, createMock())).not.toThrow();
            });
        });
    });

    describe('info', () => {
        it('should return user info', () => {
            const user: User = createMock<User>({ userinfo: createMock<UserinfoResponse>() });

            const result: UserinfoResponse = frontendController.info(user);

            expect(result).toBe(user.userinfo);
        });
    });

    describe('provider', () => {
        it('should return providers', async () => {
            const providers: GetServiceProviderInfoDo[] = [
                { id: faker.string.uuid(), name: faker.hacker.noun(), url: faker.internet.url() },
            ];
            providerService.listProviders.mockResolvedValueOnce(providers);

            const result: GetServiceProviderInfoDo[] = await frontendController.provider(createMock<User>());

            expect(result).toEqual(providers);
        });
    });
});

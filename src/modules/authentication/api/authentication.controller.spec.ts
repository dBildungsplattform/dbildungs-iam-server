import { faker } from '@faker-js/faker/';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
import { Client, EndSessionParameters, IssuerMetadata } from 'openid-client';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { FrontendConfig } from '../../../shared/config/frontend.config.js';
import { OIDC_CLIENT } from '../services/oidc-client.service.js';
import { PassportUser, User } from '../types/user.js';
import { AuthenticationController } from './authentication.controller.js';
import { UserinfoResponse } from './userinfo.response.js';

describe('AuthenticationController', () => {
    let module: TestingModule;
    let authController: AuthenticationController;
    let oidcClient: DeepMocked<Client>;
    let frontendConfig: FrontendConfig;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule],
            providers: [AuthenticationController, { provide: OIDC_CLIENT, useValue: createMock<Client>() }],
        }).compile();

        authController = module.get(AuthenticationController);
        oidcClient = module.get(OIDC_CLIENT);
        frontendConfig = module.get(ConfigService).getOrThrow<FrontendConfig>('FRONTEND');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(authController).toBeDefined();
    });

    describe('Login', () => {
        it('should redirect', () => {
            const responseMock: Response = createMock<Response>();
            const session: SessionData = { cookie: { originalMaxAge: 0 } };

            authController.login(responseMock, session);

            expect(responseMock.redirect).toHaveBeenCalled();
        });

        it('should redirect to saved redirectUrl', () => {
            const responseMock: Response = createMock<Response>();
            const sessionMock: SessionData = createMock<SessionData>({ redirectUrl: faker.internet.url() });

            authController.login(responseMock, sessionMock);

            expect(responseMock.redirect).toHaveBeenCalledWith(sessionMock.redirectUrl);
        });
    });

    describe('Logout', () => {
        function setupRequest(passportUser?: PassportUser, logoutErr?: Error, destroyErr?: Error): Request {
            const sessionMock: DeepMocked<Session> = createMock<Session>();
            const requestMock: DeepMocked<Request> = createMock<Request>({
                session: sessionMock,
                passportUser,
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

            authController.logout(requestMock, createMock());

            expect(requestMock.logout).toHaveBeenCalled();
        });

        it('should call session.destroy', () => {
            const requestMock: Request = setupRequest();
            oidcClient.issuer.metadata = createMock<IssuerMetadata>({});

            authController.logout(requestMock, createMock());

            expect(requestMock.logout).toHaveBeenCalled();
        });

        describe('when end_session_endpoint is defined', () => {
            it('should call endSessionUrl with correct params', () => {
                const user: PassportUser = createMock<PassportUser>({ id_token: faker.string.alphanumeric(32) });
                const requestMock: Request = setupRequest(user);
                oidcClient.issuer.metadata = createMock<IssuerMetadata>({ end_session_endpoint: faker.internet.url() });

                authController.logout(requestMock, createMock());

                expect(oidcClient.endSessionUrl).toHaveBeenCalledWith<[EndSessionParameters]>({
                    id_token_hint: user.id_token,
                    post_logout_redirect_uri: frontendConfig.LOGOUT_REDIRECT,
                    client_id: oidcClient.metadata.client_id,
                });
            });

            it('should redirect to return value of endSessionUrl', () => {
                const user: PassportUser = createMock<PassportUser>({ id_token: faker.string.alphanumeric(32) });
                const requestMock: Request = setupRequest(user);
                const responseMock: Response = createMock<Response>();
                oidcClient.issuer.metadata = createMock<IssuerMetadata>({ end_session_endpoint: faker.internet.url() });
                const endSessionUrl: string = faker.internet.url();
                oidcClient.endSessionUrl.mockReturnValueOnce(endSessionUrl);

                authController.logout(requestMock, responseMock);

                expect(responseMock.redirect).toHaveBeenCalledWith(endSessionUrl);
            });
        });

        describe('when end_session_endpoint is not defined', () => {
            it('should return to redirectUrl param', () => {
                const requestMock: Request = setupRequest();
                const responseMock: Response = createMock<Response>();
                oidcClient.issuer.metadata = createMock<IssuerMetadata>({ end_session_endpoint: undefined });

                authController.logout(requestMock, responseMock);

                expect(responseMock.redirect).toHaveBeenCalledWith(frontendConfig.LOGOUT_REDIRECT);
            });
        });

        describe('when request.logout fails', () => {
            it('should not throw error', () => {
                const requestMock: Request = setupRequest(undefined, new Error());

                expect(() => authController.logout(requestMock, createMock())).not.toThrow();
            });
        });

        describe('when session.destroy fails', () => {
            it('should not throw error', () => {
                const requestMock: Request = setupRequest(undefined, undefined, new Error());

                expect(() => authController.logout(requestMock, createMock())).not.toThrow();
            });
        });
    });

    describe('info', () => {
        it('should return user info', () => {
            const user: User = createMock<User>({ preferred_username: faker.internet.userName() });

            const result: UserinfoResponse = authController.info(user);

            expect(result).toBeInstanceOf(UserinfoResponse);
        });
    });
});

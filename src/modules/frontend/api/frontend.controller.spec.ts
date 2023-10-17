import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Response } from 'express';
import { TokenSet } from 'openid-client';
import { of, throwError } from 'rxjs';

import { HttpStatus } from '@nestjs/common';
import { LoginService } from '../outbound/login.service.js';
import { AuthenticationInterceptor } from './authentication.interceptor.js';
import { FrontendController, SessionData } from './frontend.controller.js';
import { LoginParams } from './user.params.js';

describe('FrontendController', () => {
    let module: TestingModule;
    let frontendController: FrontendController;
    let loginService: DeepMocked<LoginService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [FrontendController, { provide: LoginService, useValue: createMock<LoginService>() }],
        })
            .overrideInterceptor(AuthenticationInterceptor)
            .useValue(createMock<AuthenticationInterceptor>())
            .compile();

        frontendController = module.get(FrontendController);
        loginService = module.get(LoginService);
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
        it('should not throw', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            loginService.login.mockReturnValueOnce(
                of({
                    data: { access_token: faker.string.uuid() },
                } as AxiosResponse<TokenSet>),
            );

            const loginResponse: string = await frontendController.login(loginData, createMock());

            expect(loginResponse).toBe('Logged in.');
        });

        it('should call login-service with username and password', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            loginService.login.mockReturnValueOnce(
                of({
                    data: { access_token: faker.string.uuid() },
                } as AxiosResponse<TokenSet>),
            );

            await frontendController.login(loginData, createMock());

            expect(loginService.login).toHaveBeenCalledWith(loginData.username, loginData.password);
        });

        it('should set session', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            const accessToken: string = faker.string.uuid();
            loginService.login.mockReturnValueOnce(
                of({
                    data: { access_token: accessToken },
                } as AxiosResponse<TokenSet>),
            );
            const sessionMock: SessionData = createMock<SessionData>();

            await frontendController.login(loginData, sessionMock);

            expect(sessionMock.access_token).toEqual(accessToken);
        });

        it('should throw error if backend returns error', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            const error: Error = new Error('Some error from backend');
            loginService.login.mockReturnValueOnce(throwError(() => error));
            const sessionMock: SessionData = createMock<SessionData>();

            const loginPromise: Promise<string> = frontendController.login(loginData, sessionMock);

            await expect(loginPromise).rejects.toEqual(error);
        });
    });

    describe('Logout', () => {
        it('should set OK-status when the session is destroyed', () => {
            const sessionMock: SessionData = createMock<SessionData>({
                destroy(cb: (err?: unknown) => void) {
                    cb();
                    return this;
                },
            });
            const responseMock: Response = createMock<Response>();

            frontendController.logout(sessionMock, responseMock);

            expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.OK);
        });

        it('should set ERROR-status when the session could not be destroyed', () => {
            const sessionMock: SessionData = createMock<SessionData>({
                destroy(cb: (err?: unknown) => void) {
                    cb('some error');
                    return this;
                },
            });
            const responseMock: Response = createMock<Response>();

            frontendController.logout(sessionMock, responseMock);

            expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
});

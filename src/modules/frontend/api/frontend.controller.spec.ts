import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

import { LoginService } from '../outbound/login.service.js';
import { AuthenticationInterceptor } from './authentication.interceptor.js';
import { FrontendController, SessionData } from './frontend.controller.js';
import { LoginParams } from './user.params.js';
import { HttpException, InternalServerErrorException } from '@nestjs/common';

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

            const loginResponse: Observable<void> = frontendController.login(loginData, createMock());

            await expect(firstValueFrom(loginResponse)).resolves.toBeUndefined();
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

            await firstValueFrom(frontendController.login(loginData, createMock()));

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

            await firstValueFrom(frontendController.login(loginData, sessionMock));

            expect(sessionMock.set).toHaveBeenCalledWith('access_token', accessToken);
        });

        it('should return HttpException if backend returns axios error', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            const error: AxiosError = createMock<AxiosError>({ response: { data: 'ERROR', status: 500 } });
            loginService.login.mockReturnValueOnce(throwError(() => error));
            const sessionMock: SessionData = createMock<SessionData>();

            const loginObservable: Observable<void> = frontendController.login(loginData, sessionMock);

            await expect(firstValueFrom(loginObservable)).rejects.toBeInstanceOf(HttpException);
        });

        it('should return InternalServerErrorException if backend returns error', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            loginService.login.mockReturnValueOnce(throwError(() => new Error('Some unknown error from backend')));
            const sessionMock: SessionData = createMock<SessionData>();

            const loginObservable: Observable<void> = frontendController.login(loginData, sessionMock);

            await expect(firstValueFrom(loginObservable)).rejects.toBeInstanceOf(InternalServerErrorException);
        });
    });

    describe('Logout', () => {
        it('should delete session', () => {
            const sessionMock: SessionData = createMock<SessionData>();

            frontendController.logout(sessionMock);

            expect(sessionMock.delete).toHaveBeenCalled();
        });
    });
});

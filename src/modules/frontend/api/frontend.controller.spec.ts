import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable, firstValueFrom, of } from 'rxjs';

import { LoginService } from '../outbound/login.service.js';
import { FrontendController, SessionData } from './frontend.controller.js';
import { LoginParams } from './user.params.js';

describe('FrontendController', () => {
    let module: TestingModule;
    let frontendController: FrontendController;
    let loginService: DeepMocked<LoginService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [FrontendController, { provide: LoginService, useValue: createMock<LoginService>() }],
        }).compile();

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
                    data: new TokenSet(),
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
                    data: new TokenSet(),
                } as AxiosResponse<TokenSet>),
            );

            await firstValueFrom(frontendController.login(loginData, createMock()));

            expect(loginService.login).toHaveBeenCalledWith(loginData.username, loginData.password);
        });

        it('should set- tokens on session', async () => {
            const loginData: LoginParams = {
                username: faker.internet.userName(),
                password: faker.internet.password(),
            };
            const tokenSet: TokenSet = new TokenSet();
            loginService.login.mockReturnValueOnce(
                of({
                    data: tokenSet,
                } as AxiosResponse<TokenSet>),
            );
            const sessionMock: SessionData = createMock<SessionData>();

            await firstValueFrom(frontendController.login(loginData, sessionMock));

            expect(sessionMock.set).toHaveBeenCalledWith('keycloak_tokens', tokenSet);
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

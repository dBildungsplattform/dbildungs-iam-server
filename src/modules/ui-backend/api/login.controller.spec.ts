import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LoginService } from '../domain/login.service.js';
import { faker } from '@faker-js/faker';
import { TokenSet } from 'openid-client';
import { UserParams } from './user.params.js';
import { KeycloakClientError, UserAuthenticationFailedError } from '../../../shared/error/index.js';
import { NewLoginService } from '../domain/new-login.service.js';

describe('LoginController', () => {
    let module: TestingModule;
    let loginController: LoginController;
    let loginServiceMock: DeepMocked<LoginService>;
    let someServiceMock: DeepMocked<NewLoginService>;
    let tokenSet: DeepMocked<TokenSet>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [
                LoginController,
                {
                    provide: LoginService,
                    useValue: createMock<LoginService>(),
                },
                {
                    provide: NewLoginService,
                    useValue: createMock<NewLoginService>(),
                },
                {
                    provide: TokenSet,
                    useValue: createMock<TokenSet>(),
                },
            ],
        }).compile();
        loginController = module.get(LoginController);
        loginServiceMock = module.get(LoginService);
        someServiceMock = module.get(NewLoginService);
        tokenSet = module.get(TokenSet);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(loginController).toBeDefined();
    });

    describe('when getting result from service', () => {
        it('should not throw', async () => {
            const userParams: UserParams = {
                username: faker.string.alpha(),
                password: faker.string.alpha(),
            };
            loginServiceMock.getTokenForUser.mockResolvedValue(tokenSet);
            await expect(loginController.loginUser(userParams)).resolves.not.toThrow();
            expect(loginServiceMock.getTokenForUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('when getting KeyCloak-error from service', () => {
        it('should throw', async () => {
            const errorMsg: string = 'keycloak not available';
            const userParams: UserParams = {
                username: faker.string.alpha(),
                password: faker.string.alpha(),
            };
            loginServiceMock.getTokenForUser.mockImplementation(() => {
                throw new KeycloakClientError(errorMsg);
            });
            await expect(loginController.loginUser(userParams)).rejects.toThrow(errorMsg);
            expect(loginServiceMock.getTokenForUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('when getting User-authentication-failed-error from service', () => {
        it('should throw', async () => {
            const errorMsg: string = 'user could not be authenticated';
            const userParams: UserParams = {
                username: faker.string.alpha(),
                password: faker.string.alpha(),
            };
            loginServiceMock.getTokenForUser.mockImplementation(() => {
                throw new UserAuthenticationFailedError(errorMsg);
            });
            await expect(loginController.loginUser(userParams)).rejects.toThrow(errorMsg);
            expect(loginServiceMock.getTokenForUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('when getting User-authentication-failed-error from service', () => {
        it('should throw', async () => {
            const userParams: UserParams = {
                username: faker.string.alpha(),
                password: faker.string.alpha(),
            };
            someServiceMock.auth.mockResolvedValueOnce({
                ok: false,
                error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
            });
            await expect(loginController.loginUserResult(userParams)).resolves.toStrictEqual<
                Result<UserAuthenticationFailedError>
            >({
                ok: false,
                error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
            });
            expect(someServiceMock.auth).toHaveBeenCalledTimes(1);
        });
    });
});

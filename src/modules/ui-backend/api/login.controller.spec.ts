import {Test, TestingModule} from "@nestjs/testing";
import {LoginController} from "./login.controller";
import {MapperTestModule} from "../../../../test/utils";
import {createMock, DeepMocked} from "@golevelup/ts-jest";
import {LoginService} from "../domain/login.service";
import {faker} from "@faker-js/faker";
import {TokenSet} from "openid-client";
import {UserParams} from "./user.params";
import {KeycloakClientError, UserAuthenticationFailedError} from "../../../shared/error";

describe('LoginController', () => {
    let module: TestingModule;
    let loginController: LoginController;
    let loginServiceMock: DeepMocked<LoginService>;
    let tokenSet: DeepMocked<TokenSet>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                LoginController,
                {
                    provide: LoginService,
                    useValue: createMock<LoginService>(),
                },
                {
                    provide: TokenSet,
                    useValue: createMock<TokenSet>()
                }
            ],
        }).compile();
        loginController = module.get(LoginController);
        loginServiceMock = module.get(LoginService);
        tokenSet = module.get(TokenSet);
        console.log(loginServiceMock);

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
                password: faker.string.alpha()
            };
            loginServiceMock.getTokenForUser.mockResolvedValue(tokenSet);
            await expect(loginController.loginUser(userParams)).resolves.not.toThrow();
            expect(loginServiceMock.getTokenForUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('when getting KeyCloak-error from service', () => {
        it('should throw', async () => {
            const errorMsg = 'keycloak not available';
            const userParams: UserParams = {
                username: faker.string.alpha(),
                password: faker.string.alpha()
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
            const errorMsg = 'user could not be authenticated';
            const userParams: UserParams = {
                username: faker.string.alpha(),
                password: faker.string.alpha()
            };
            loginServiceMock.getTokenForUser.mockImplementation(() => {
                throw new UserAuthenticationFailedError(errorMsg);
            });
            await expect(loginController.loginUser(userParams)).rejects.toThrow(errorMsg);
            expect(loginServiceMock.getTokenForUser).toHaveBeenCalledTimes(1);
        });
    });
})

import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service.js';

describe('LoginService', () => {
    let module: TestingModule;
    let loginService: LoginService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [LoginService],
        }).compile();
        loginService = module.get(LoginService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(loginService).toBeDefined();
    });

    describe('getTokenForUser by username and password', () => {
        describe('when user credentials are correct', () => {
            it('should return token', async () => {});
        });

        describe('when user credentials are not correct', () => {
            it('should return User-authentication-failed-error', async () => {});
        });
    });
});

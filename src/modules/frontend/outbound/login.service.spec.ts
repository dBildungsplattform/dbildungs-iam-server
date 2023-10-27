import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule } from '../../../../test/utils/index.js';
import { BackendHttpService } from './backend-http.service.js';
import { LoginService } from './login.service.js';

describe('LoginService', () => {
    let module: TestingModule;
    let sut: LoginService;
    let backendHttpService: DeepMocked<BackendHttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                LoginService,
                {
                    provide: BackendHttpService,
                    useValue: createMock<BackendHttpService>(),
                },
            ],
        }).compile();

        sut = module.get(LoginService);
        backendHttpService = module.get(BackendHttpService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('login', () => {
        it('should call backend', () => {
            const username: string = faker.internet.userName();
            const password: string = faker.internet.password();

            sut.login(username, password);

            expect(backendHttpService.post).toHaveBeenCalledWith(expect.stringContaining('/api/login'), {
                username,
                password,
            });
        });
    });
});

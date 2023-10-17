import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule } from '../../../../test/utils/index.js';
import { LoginService } from './login.service.js';

describe('LoginService', () => {
    let module: TestingModule;
    let sut: LoginService;
    let httpService: DeepMocked<HttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [LoginService, { provide: HttpService, useValue: createMock<HttpService>() }],
        }).compile();

        sut = module.get(LoginService);
        httpService = module.get(HttpService);
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

            expect(httpService.post).toHaveBeenCalledWith(expect.stringContaining('/api/login'), {
                username,
                password,
            });
        });
    });
});

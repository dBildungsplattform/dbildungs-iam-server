import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule } from '../../../../test/utils/index.js';
import { BackendHttpService } from './backend-http.service.js';
import { ResetPasswordResponse, UserService } from './user.service.js';

describe('UserService', () => {
    let module: TestingModule;
    let sut: UserService;
    let backendHttpService: DeepMocked<BackendHttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                UserService,
                {
                    provide: BackendHttpService,
                    useValue: createMock<BackendHttpService>(),
                },
            ],
        }).compile();

        sut = module.get(UserService);
        backendHttpService = module.get(BackendHttpService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('resetPasswordForUserByUserId', () => {
        it('should call backend', () => {
            const userId: string = faker.string.numeric();
            sut.resetPasswordForUserByUserId(userId);
            expect(backendHttpService.patch).toHaveBeenCalledWith(
                expect.stringContaining('/api/person/' + userId + '/password'),
                {},
            );
        });
    });

    describe('isResetPasswordResponse', () => {
        describe('when obj is ResetPasswordResponse', () => {
            it('should be truthy', () => {
                const response: ResetPasswordResponse = {
                    ok: true,
                    value: faker.string.alphanumeric({ length: { min: 10, max: 10 }, casing: 'mixed' }),
                };
                expect(sut.isResetPasswordResponse(response)).toBeTruthy();
            });
            describe('when obj is not a ResetPasswordResponse', () => {
                it('should be falsy', () => {
                    const response: unknown = {};
                    expect(sut.isResetPasswordResponse(response)).toBeFalsy();
                });
            });
        });
    });
});

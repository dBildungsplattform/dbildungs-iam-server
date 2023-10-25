import { Test, TestingModule } from '@nestjs/testing';
import { GetServiceProviderInfoDo } from './get-service-provider-info.do.js';

describe('RolleService', () => {
    let module: TestingModule;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('construct GetServiceProviderInfoDo', () => {
        describe('when creating via constructor', () => {
            it('should be defined', () => {
                const getServiceProviderInfoDo: GetServiceProviderInfoDo = new GetServiceProviderInfoDo();
                expect(getServiceProviderInfoDo).toBeDefined();
            });
        });
    });
});

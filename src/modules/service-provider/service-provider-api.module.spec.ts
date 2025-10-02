import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../test/utils/index.js';
import { ProviderController } from './api/provider.controller.js';
import { ServiceProviderApiModule } from './service-provider-api.module.js';

describe('ServiceProviderApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), ServiceProviderApiModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve ProviderController', () => {
            expect(module.get(ProviderController)).toBeInstanceOf(ProviderController);
        });
    });
});

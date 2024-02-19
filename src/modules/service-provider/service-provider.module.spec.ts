import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../test/utils/index.js';
import { ServiceProviderModule } from './service-provider.module.js';

describe('ServiceProviderModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), ServiceProviderModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});

import { Test, TestingModule } from '@nestjs/testing';

import { FrontendModule } from './frontend.module.js';

describe('FrontendModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [FrontendModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});

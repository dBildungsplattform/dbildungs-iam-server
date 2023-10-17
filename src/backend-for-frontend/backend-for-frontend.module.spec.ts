import { Test, TestingModule } from '@nestjs/testing';

import { BackendForFrontendModule } from './backend-for-frontend.module.js';

describe('FrontendModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [BackendForFrontendModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});

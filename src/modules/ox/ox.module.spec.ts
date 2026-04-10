import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseTestModule } from '../../../test/utils/index.js';
import { OxModule } from './ox.module.js';
import { OxService } from './domain/ox.service.js';
import { CommonTestModule } from '../../../test/utils/common-test.module.js';

describe('OxModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [CommonTestModule, OxModule, DatabaseTestModule.forRoot()],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve OxService', () => {
            expect(module.get(OxService)).toBeInstanceOf(OxService);
        });
    });
});

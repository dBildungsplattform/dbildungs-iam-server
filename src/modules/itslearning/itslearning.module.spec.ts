import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, DatabaseTestModule } from '../../../test/utils/index.js';
import { ItsLearningModule } from './itslearning.module.js';
import { ItsLearningIMSESService } from './itslearning.service.js';

describe('ItsLearningModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, ItsLearningModule, DatabaseTestModule.forRoot()],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve ItsLearningIMSESService', () => {
            expect(module.get(ItsLearningIMSESService)).toBeInstanceOf(ItsLearningIMSESService);
        });
    });
});

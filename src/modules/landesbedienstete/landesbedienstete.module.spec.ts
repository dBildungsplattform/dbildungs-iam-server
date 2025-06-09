import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { EventModule } from '../../core/eventbus/index.js';
import { LandesbediensteteController } from './api/landesbedienstete.controller.js';
import { LandesbediensteteWorkflowFactory } from './domain/landesbedienstete-workflow.factory.js';
import { LandesbediensteteModule } from './landesbedienstete.module.js';

describe('LandesbediensteteModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                LandesbediensteteModule,

                ConfigTestModule,
                DatabaseTestModule.forRoot(),
                EventModule,
                MapperTestModule,
            ],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve LandesbediensteteWorkflowFactory', () => {
            expect(module.get(LandesbediensteteWorkflowFactory)).toBeInstanceOf(LandesbediensteteWorkflowFactory);
        });

        it('should resolve LandesbediensteteController', () => {
            expect(module.get(LandesbediensteteController)).toBeInstanceOf(LandesbediensteteController);
        });
    });
});

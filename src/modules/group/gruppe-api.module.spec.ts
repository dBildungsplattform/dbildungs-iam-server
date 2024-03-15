import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../test/utils/index.js';
import { GruppenApiModule } from './gruppe-api.module.js';
import { GruppenController } from './api/gruppe.controller.js';
import { GruppenFactory } from './domain/gruppe.factory.js';
import { GruppenRepository } from './domain/gruppe.repo.js';

describe('GruppeApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), GruppenApiModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve GruppenController', () => {
            expect(module.get(GruppenController)).toBeInstanceOf(GruppenController);
        });

        it('should resolve GruppenRepository', () => {
            expect(module.get(GruppenRepository)).toBeInstanceOf(GruppenRepository);
        });

        it('should resolve GruppenFactory', () => {
            expect(module.get(GruppenFactory)).toBeInstanceOf(GruppenFactory);
        });
    });
});

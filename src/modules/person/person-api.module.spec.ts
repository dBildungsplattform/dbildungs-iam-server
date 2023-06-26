import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../shared/index.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonApiModule } from './person-api.module.js';

describe('PersonApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.register(), MapperTestModule, PersonApiModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve PersonController', () => {
            expect(module.get(PersonController)).toBeInstanceOf(PersonController);
        });

        it('should resolve PersonUc', () => {
            expect(module.get(PersonUc)).toBeInstanceOf(PersonUc);
        });
    });
});

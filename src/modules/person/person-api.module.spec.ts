import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../shared/index.js';
import { PersonApiModule } from './person-api.module.js';
import { PersonController } from './person.controller.js';
import { PersonUc } from './person.uc.js';

describe('PersonApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule, MapperTestModule, PersonApiModule],
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

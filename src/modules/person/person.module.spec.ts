import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../shared/index.js';
import { PersonModule } from './person.module.js';
import { PersonMapperProfile } from './person.mapper.profile.js';
import { PersonRepo } from './person.repo.js';
import { PersonService } from './person.service.js';

describe('PersonModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule, MapperTestModule, PersonModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve PersonProfile', () => {
            expect(module.get(PersonMapperProfile)).toBeInstanceOf(PersonMapperProfile);
        });

        it('should resolve PersonRepo', () => {
            expect(module.get(PersonRepo)).toBeInstanceOf(PersonRepo);
        });

        it('should resolve PersonService', () => {
            expect(module.get(PersonService)).toBeInstanceOf(PersonService);
        });
    });
});

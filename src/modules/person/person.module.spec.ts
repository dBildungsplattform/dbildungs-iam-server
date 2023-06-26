import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../shared/index.js';
import { PersonService } from './domain/person.service.js';
import { PersonRepo } from './persistence/person.repo.js';
import { PersonModule } from './person.module.js';
import { PersonMapperProfile } from './person.mapper.profile.js';

describe('PersonModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.register(), MapperTestModule, PersonModule],
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

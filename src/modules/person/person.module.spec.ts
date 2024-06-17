import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { PersonService } from './domain/person.service.js';
import { PersonRepo } from './persistence/person.repo.js';
import { PersonModule } from './person.module.js';
import { PersonPersistenceMapperProfile } from './persistence/person-persistence.mapper.profile.js';
import { EventModule } from '../../core/eventbus/index.js';

describe('PersonModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule, PersonModule, EventModule],
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
            expect(module.get(PersonPersistenceMapperProfile)).toBeInstanceOf(PersonPersistenceMapperProfile);
        });

        it('should resolve PersonRepo', () => {
            expect(module.get(PersonRepo)).toBeInstanceOf(PersonRepo);
        });

        it('should resolve PersonService', () => {
            expect(module.get(PersonService)).toBeInstanceOf(PersonService);
        });
    });
});

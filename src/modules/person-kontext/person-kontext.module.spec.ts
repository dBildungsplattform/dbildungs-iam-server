import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { PersonKontextModule } from './person-kontext.module.js';
import { PersonenkontextRepo } from './persistence/personenkontext.repo.js';
import { PersonenkontextService } from './domain/personenkontext.service.js';
import { PersonRepo } from '../person/persistence/person.repo.js';

describe('PersonKontextModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule, PersonKontextModule],
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
            expect(module.get(PersonRepo)).toBeInstanceOf(PersonRepo);
        });

        it('should resolve PersonRepo', () => {
            expect(module.get(PersonenkontextRepo)).toBeInstanceOf(PersonenkontextRepo);
        });

        it('should resolve PersonService', () => {
            expect(module.get(PersonenkontextService)).toBeInstanceOf(PersonenkontextService);
        });
    });
});

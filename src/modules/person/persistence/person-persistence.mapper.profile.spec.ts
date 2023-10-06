import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MappingError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from '../persistence/person.entity.js';
import { PersonPersistenceMapperProfile } from './person-persistence.mapper.profile.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';

describe('PersonPersistenceMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [PersonPersistenceMapperProfile],
        }).compile();
        sut = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when mapper is initialized', () => {
        it('should map PersonDo to PersonEntity', () => {
            const person: PersonDo<true> = DoFactory.createPerson(true);
            expect(() => sut.map(person, PersonDo, PersonEntity)).not.toThrowError(MappingError);
        });

        it('should map PersonEntity to PersonDo', () => {
            const person: PersonDo<true> = new PersonEntity();
            expect(() => sut.map(person, PersonEntity, PersonDo)).not.toThrowError(MappingError);
        });

        it('should map PersonenkontextDo to PersonenkontextEntity', () => {
            const personenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
            expect(() => sut.map(personenkontext, PersonenkontextDo, PersonenkontextEntity)).not.toThrowError(
                MappingError,
            );
        });

        it('should map PersonenkontextEntity to PersonenkontextDo', () => {
            const personenkontext: PersonenkontextEntity = new PersonenkontextEntity();
            personenkontext.person = new PersonEntity();
            expect(() => sut.map(personenkontext, PersonenkontextEntity, PersonenkontextDo<true>)).not.toThrowError(
                MappingError,
            );
        });
    });
});

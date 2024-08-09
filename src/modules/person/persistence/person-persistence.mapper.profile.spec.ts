import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MappingError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from '../persistence/person.entity.js';
import { PersonPersistenceMapperProfile } from './person-persistence.mapper.profile.js';
import { createMock } from '@golevelup/ts-jest';
import { MapperTestModule } from '../../../../test/utils/index.js';

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
            const person: PersonDo<true> = createMock<PersonDo<true>>();
            expect(() => sut.map(person, PersonDo, PersonEntity)).not.toThrowError(MappingError);
        });
    });
});

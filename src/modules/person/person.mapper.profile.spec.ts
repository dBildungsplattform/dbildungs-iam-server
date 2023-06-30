import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../shared/testing/index.js';
import { MappingError } from '../../shared/error/index.js';
import { CreatePersonBodyParams } from './api/create-person.body.params.js';
import { CreatePersonDto } from './domain/create-person.dto.js';
import { PersonDo } from './domain/person.do.js';
import { PersonEntity } from './persistence/person.entity.js';
import { PersonMapperProfile } from './person.mapper.profile.js';
import { faker } from '@faker-js/faker';

describe('PersonMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [PersonMapperProfile],
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
        it('should map CreatePersonBodyParams to CreatePersonDTO', () => {
            const params: CreatePersonBodyParams = {
                client: faker.string.uuid(),
                mainOrganization: faker.string.uuid(),
                referrer: 'referrer',
                name: {
                    firstName: 'john',
                    lastName: 'doe',
                },
                birth: {},
                localization: 'de-DE',
            };
            expect(() => sut.map(params, CreatePersonBodyParams, CreatePersonDto)).not.toThrowError(MappingError);
        });

        it('should map CreatePersonDto to PersonDo', () => {
            const dto: CreatePersonDto = {
                client: faker.string.uuid(),
                firstName: 'john',
                lastName: 'doe',
                localization: 'de-DE',
                referrer: 'referrer',
            };
            expect(() => sut.map(dto, CreatePersonDto, PersonDo)).not.toThrowError(MappingError);
        });

        it('should map PersonDo to PersonEntity', () => {
            const person: PersonDo<true> = DoFactory.createPerson(true);
            expect(() => sut.map(person, PersonDo, PersonEntity)).not.toThrowError(MappingError);
        });

        it('should map PersonEntity to PersonDo', () => {
            const person: PersonDo<true> = new PersonEntity();
            expect(() => sut.map(person, PersonEntity, PersonDo)).not.toThrowError(MappingError);
        });
    });
});

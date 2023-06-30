import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../shared/testing/index.js';
import { MappingError } from '../../shared/error/index.js';
import { CreatePersonBodyParams } from './api/create-person.body.params.js';
import { CreatePersonDto } from './domain/create-person.dto.js';
import { PersonDo } from './domain/person.do.js';
import { PersonEntity } from './persistence/person.entity.js';
import {
    PersonMapperProfile,
    personGenderToGenderConverter,
    personTrustLevelToTrustLevelConverter,
} from './person.mapper.profile.js';
import { faker } from '@faker-js/faker';
import { Gender, PersonGender, PersonTrustLevel, TrustLevel } from './domain/person.enums.js';

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

    describe('personGenderToGenderConverter', () => {
        describe('when converting PersonGender to Gender', () => {
            it('should convert DIVERSE', () => {
                expect(personGenderToGenderConverter.convert(PersonGender.DIVERSE)).toBe(Gender.DIVERSE);
            });

            it('should convert FEMALE', () => {
                expect(personGenderToGenderConverter.convert(PersonGender.FEMALE)).toBe(Gender.FEMALE);
            });

            it('should convert MALE', () => {
                expect(personGenderToGenderConverter.convert(PersonGender.MALE)).toBe(Gender.MALE);
            });

            it('should convert UNKNOWN', () => {
                expect(personGenderToGenderConverter.convert(PersonGender.UNKNOWN)).toBe(Gender.UNKNOWN);
            });

            it('should convert undefined', () => {
                expect(personGenderToGenderConverter.convert(undefined as unknown as PersonGender)).toBe(
                    Gender.UNKNOWN,
                );
            });
        });
    });

    describe('personTrustLevelToTrustLevelConverter', () => {
        describe('when converting PersonTrustLevel to TrustLevel', () => {
            it('should convert NONE', () => {
                expect(personTrustLevelToTrustLevelConverter.convert(PersonTrustLevel.NONE)).toBe(TrustLevel.NONE);
            });

            it('should convert TRUSTED', () => {
                expect(personTrustLevelToTrustLevelConverter.convert(PersonTrustLevel.TRUSTED)).toBe(
                    TrustLevel.TRUSTED,
                );
            });

            it('should convert VERIFIED', () => {
                expect(personTrustLevelToTrustLevelConverter.convert(PersonTrustLevel.VERIFIED)).toBe(
                    TrustLevel.VERIFIED,
                );
            });

            it('should convert UNKNOWN', () => {
                expect(personTrustLevelToTrustLevelConverter.convert(PersonTrustLevel.UNKNOWN)).toBe(
                    TrustLevel.UNKNOWN,
                );
            });

            it('should convert undefined', () => {
                expect(personTrustLevelToTrustLevelConverter.convert(undefined as unknown as PersonTrustLevel)).toBe(
                    TrustLevel.UNKNOWN,
                );
            });
        });
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

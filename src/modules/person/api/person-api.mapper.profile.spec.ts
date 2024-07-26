import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { MappingError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../personenkontext/domain/personenkontext.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from './create-person.dto.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/param/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../personenkontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../personenkontext/api/param/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { LoeschungDto } from './loeschung.dto.js';
import { LoeschungResponse } from './loeschung.response.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonGeburtDto } from './person-geburt.dto.js';
import { PersonNameDto } from './person-name.dto.js';
import { PersonNameParams } from './person-name.params.js';
import { PersonendatensatzResponseAutomapper } from './personendatensatz.response-automapper.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/param/personenkontext-query.params.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { UpdatePersonenkontextDto } from '../../personenkontext/api/update-personenkontext.dto.js';
import { UpdatePersonenkontextBodyParams } from '../../personenkontext/api/param/update-personenkontext.body.params.js';
import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { MapperTestModule } from '../../../../test/utils/index.js';

describe('PersonApiMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [PersonApiMapperProfile],
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
                stammorganisation: faker.string.uuid(),
                referrer: 'referrer',
                name: {
                    vorname: 'john',
                    familienname: 'doe',
                },
                geburt: {},
                lokalisierung: 'de-DE',
            };
            expect(() => sut.map(params, CreatePersonBodyParams, CreatePersonDto)).not.toThrow(MappingError);
        });

        it('should map CreatePersonDto to PersonDo', () => {
            const dto: CreatePersonDto = {
                vorname: 'john',
                familienname: 'doe',
                lokalisierung: 'de-DE',
                referrer: 'referrer',
            };
            expect(() => sut.map(dto, CreatePersonDto, PersonDo)).not.toThrow(MappingError);
        });

        it('should map PersonDo to PersonendatensatzResponseAutomapper', () => {
            const personDo: PersonDo<true> = {
                id: faker.string.uuid(),
                vorname: 'john',
                familienname: 'doe',
                lokalisierung: 'de-DE',
                referrer: 'referrer',
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                revision: '1',
                keycloakUserId: faker.string.uuid(),
                mandant: '',
                stammorganisation: faker.string.uuid(),
                initialenFamilienname: 'd',
                initialenVorname: 'j',
                rufname: 'j',
                nameTitel: '',
                nameAnrede: [''],
                namePraefix: [''],
                nameSuffix: [''],
                nameSortierindex: 'asc',
                geburtsdatum: faker.date.past(),
                geburtsort: 'Hamburg',
                geschlecht: Geschlecht.W,
                vertrauensstufe: Vertrauensstufe.KEIN,
                auskunftssperre: false,
                personalnummer: faker.string.numeric(),
            };
            expect(() => sut.map(personDo, PersonDo, PersonendatensatzResponseAutomapper)).not.toThrow(MappingError);
        });

        it('should map CreatePersonenkontextBodyParams to CreatePersonenkontextDto', () => {
            const body: CreatePersonenkontextBodyParams = {
                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
            };
            expect(() => sut.map(body, CreatePersonenkontextBodyParams, CreatePersonenkontextDto)).not.toThrow(
                MappingError,
            );
        });

        it('should map CreatePersonenkontextDto to PersonenkontextDo', () => {
            const dto: CreatePersonenkontextDto = {
                personId: faker.string.uuid(),
                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
            };
            expect(() => sut.map(dto, CreatePersonenkontextDto, PersonenkontextDo)).not.toThrow(MappingError);
        });

        it('should map CreatedPersonenkontextDto to PersonenkontextResponse', () => {
            expect(() =>
                sut.map({} as CreatedPersonenkontextDto, CreatedPersonenkontextDto, PersonenkontextResponse),
            ).not.toThrow(MappingError);
        });

        it('should map PersonenkontextQueryParams to FindPersonenkontextDto', () => {
            const params: PersonenkontextQueryParams = {
                sichtfreigabe: SichtfreigabeType.JA,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
                rolle: Rolle.LERNENDER,
            };
            expect(() => sut.map(params, PersonenkontextQueryParams, FindPersonenkontextDto)).not.toThrow(MappingError);
        });

        it('should map FindPersonenkontextDto to PersonenkontextDo', () => {
            const dto: FindPersonenkontextDto = {
                personId: faker.string.uuid(),
                sichtfreigabe: SichtfreigabeType.JA,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
                rolle: Rolle.LERNENDER,
            };
            expect(() => sut.map(dto, FindPersonenkontextDto, PersonenkontextDo)).not.toThrow(MappingError);
        });

        it('should map FindPersonenkontextByIdParams to FindPersonenkontextByIdDto', () => {
            expect(() =>
                sut.map({} as FindPersonenkontextByIdParams, FindPersonenkontextByIdParams, FindPersonenkontextByIdDto),
            ).not.toThrow(MappingError);
        });

        it('should map LoeschungDto to LoeschungResponse', () => {
            expect(() => sut.map({} as LoeschungDto, LoeschungDto, LoeschungResponse)).not.toThrow(MappingError);
        });

        it('should map PersonNameDto to PersonNameParams', () => {
            expect(() => sut.map({} as PersonNameDto, PersonNameDto, PersonNameParams)).not.toThrow(MappingError);
        });

        it('should map PersonGeburtDto to PersonBirthParams', () => {
            expect(() => sut.map({} as PersonGeburtDto, PersonGeburtDto, PersonBirthParams)).not.toThrow(MappingError);
        });

        it('should map UpdatePersonenkontextBodyParams to UpdatePersonenkontextDto', () => {
            expect(() =>
                sut.map(
                    {} as UpdatePersonenkontextBodyParams,
                    UpdatePersonenkontextBodyParams,
                    UpdatePersonenkontextDto,
                ),
            ).not.toThrow(MappingError);
        });

        it('should map UpdatePersonenkontextDto to PersonenkontextDo', () => {
            expect(() =>
                sut.map({} as UpdatePersonenkontextDto, UpdatePersonenkontextDto, PersonenkontextDo),
            ).not.toThrow(MappingError);
        });
    });
});

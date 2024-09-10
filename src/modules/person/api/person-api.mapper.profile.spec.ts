import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { MappingError } from '../../../shared/error/index.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../personenkontext/domain/personenkontext.enums.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/param/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../personenkontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../personenkontext/api/param/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/param/personenkontext-query.params.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { UpdatePersonenkontextDto } from '../../personenkontext/api/update-personenkontext.dto.js';
import { UpdatePersonenkontextBodyParams } from '../../personenkontext/api/param/update-personenkontext.body.params.js';
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
        it('should map PersonenkontextDo to CreatedPersonenkontextDto with loeschung and organisation', () => {
            const personenkontextDo: PersonenkontextDo<true> = {
                id: faker.string.uuid(),
                personId: faker.string.uuid(),

                rolleId: faker.string.uuid(),
                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
                loeschungZeitpunkt: new Date(),
                organisationId: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                mandant: 'mandant',
                sichtfreigabe: SichtfreigabeType.JA,
                revision: '1',
            };

            const result: CreatedPersonenkontextDto = sut.map(
                personenkontextDo,
                PersonenkontextDo,
                CreatedPersonenkontextDto,
            );

            expect(result).toBeDefined();
            expect(result.loeschung).toBeDefined();
            expect(result.loeschung?.zeitpunkt).toEqual(personenkontextDo.loeschungZeitpunkt);
            expect(result.organisation).toBeDefined();
            expect(result.organisation.id).toEqual(personenkontextDo.organisationId);
        });

        it('should map PersonenkontextDo to CreatedPersonenkontextDto when loeschung is undefined', () => {
            const personenkontextDo: PersonenkontextDo<true> = {
                id: faker.string.uuid(),
                personId: faker.string.uuid(),

                rolleId: faker.string.uuid(),
                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
                loeschungZeitpunkt: undefined,
                organisationId: faker.string.uuid(),
                createdAt: new Date(),
                updatedAt: new Date(),
                mandant: 'mandant',
                sichtfreigabe: SichtfreigabeType.JA,
                revision: '1',
            };

            const result: CreatedPersonenkontextDto = sut.map(
                personenkontextDo,
                PersonenkontextDo,
                CreatedPersonenkontextDto,
            );

            expect(result).toBeDefined();
            expect(result.loeschung).toBeUndefined();
            expect(result.loeschung?.zeitpunkt).toBeUndefined();
            expect(result.organisation).toBeDefined();
            expect(result.organisation.id).toEqual(personenkontextDo.organisationId);
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

            expect(() =>
                sut.map(
                    { loeschung: { zeitpunkt: faker.date.recent() } } as CreatedPersonenkontextDto,
                    CreatedPersonenkontextDto,
                    PersonenkontextResponse,
                ),
            ).not.toThrow(MappingError);
        });

        it('should map CreatedPersonenkontextDto to PersonenkontextResponse when loeschung is undefined', () => {
            const createdPersonenkontextDto: CreatedPersonenkontextDto = {
                id: faker.string.uuid(),

                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
                loeschung: undefined,
                organisation: { id: faker.string.uuid() },
                mandant: 'mandant',
                sichtfreigabe: SichtfreigabeType.JA,
                revision: '1',
            };

            const result: PersonenkontextResponse = sut.map(
                createdPersonenkontextDto,
                CreatedPersonenkontextDto,
                PersonenkontextResponse,
            );

            expect(result).toBeDefined();
            expect(result.loeschung).toBeUndefined();
            expect(result.loeschung?.zeitpunkt).toBeUndefined();
            expect(result.organisation).toBeDefined();
            expect(result.organisation.id).toEqual(createdPersonenkontextDto.organisation.id);
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

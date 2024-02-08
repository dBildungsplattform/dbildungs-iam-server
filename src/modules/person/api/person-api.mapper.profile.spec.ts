import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { MappingError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextDo } from '../../person-kontext/domain/personenkontext.do.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../../person-kontext/domain/personenkontext.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from './create-person.dto.js';
import { CreatePersonenkontextBodyParams } from '../../person-kontext/api/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../person-kontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../person-kontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../person-kontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../person-kontext/api/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../person-kontext/api/find-personenkontext.dto.js';
import { LoeschungDto } from './loeschung.dto.js';
import { LoeschungResponse } from './loeschung.response.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonGeburtDto } from './person-geburt.dto.js';
import { PersonNameDto } from './person-name.dto.js';
import { PersonNameParams } from './person-name.params.js';
import { PersonDto } from './person.dto.js';
import { PersonResponse } from './person.response.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextQueryParams } from '../../person-kontext/api/personenkontext-query.params.js';
import { PersonenkontextDto } from '../../person-kontext/api/personenkontext.dto.js';
import { PersonenkontextResponse } from '../../person-kontext/api/personenkontext.response.js';
import { PersonenkontextdatensatzResponse } from '../../person-kontext/api/personenkontextdatensatz.response.js';
import { UpdatePersonenkontextDto } from '../../person-kontext/api/update-personenkontext.dto.js';
import { UpdatePersonenkontextBodyParams } from '../../person-kontext/api/update-personenkontext.body.params.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';
import { UpdatePersonDto } from './update-person.dto.js';

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
                username: faker.internet.userName(),
                mandant: faker.string.uuid(),
                vorname: 'john',
                familienname: 'doe',
                lokalisierung: 'de-DE',
                referrer: 'referrer',
            };
            expect(() => sut.map(dto, CreatePersonDto, PersonDo)).not.toThrow(MappingError);
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

        it('should map PersonenkontextDo to CreatedPersonenkontextDto', () => {
            const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
            expect(() => sut.map(personenkontextDo, PersonenkontextDo, CreatedPersonenkontextDto)).not.toThrow(
                MappingError,
            );
        });

        it('should map PersonenkontextDo without loeschungZeitpunkt to CreatedPersonenkontextDto', () => {
            const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
            personenkontextDo.loeschungZeitpunkt = undefined;

            expect(() => sut.map(personenkontextDo, PersonenkontextDo, CreatedPersonenkontextDto)).not.toThrow(
                MappingError,
            );
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

        it('should map PersonenkontextDo to PersonenkontextDto', () => {
            expect(() => sut.map({} as PersonenkontextDo<boolean>, PersonenkontextDo, PersonenkontextDto)).not.toThrow(
                MappingError,
            );
        });

        it('should map PersonDo to PersonDto', () => {
            expect(() => sut.map({} as PersonDo<boolean>, PersonDo, PersonDto)).not.toThrow(MappingError);
        });

        it('should map LoeschungDto to LoeschungResponse', () => {
            expect(() => sut.map({} as LoeschungDto, LoeschungDto, LoeschungResponse)).not.toThrow(MappingError);
        });

        it('should map PersonenkontextDto to PersonenkontextResponse', () => {
            expect(() => sut.map({} as PersonenkontextDto, PersonenkontextDto, PersonenkontextResponse)).not.toThrow(
                MappingError,
            );
        });

        it('should map PersonDto to PersonResponse', () => {
            expect(() => sut.map({} as PersonDto, PersonDto, PersonResponse)).not.toThrow(MappingError);
        });

        it('should map PersonNameDto to PersonNameParams', () => {
            expect(() => sut.map({} as PersonNameDto, PersonNameDto, PersonNameParams)).not.toThrow(MappingError);
        });

        it('should map PersonGeburtDto to PersonBirthParams', () => {
            expect(() => sut.map({} as PersonGeburtDto, PersonGeburtDto, PersonBirthParams)).not.toThrow(MappingError);
        });

        it('should map PersonendatensatzDto to PersonendatensatzResponse', () => {
            expect(() =>
                sut.map({} as PersonendatensatzDto, PersonendatensatzDto, PersonendatensatzResponse),
            ).not.toThrow(MappingError);
        });

        it('should map PersonenkontextDto to PersonenkontextdatensatzResponse', () => {
            expect(() =>
                sut.map({} as PersonenkontextDto, PersonenkontextDto, PersonenkontextdatensatzResponse),
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

        it('should map UpdatePersonBodyParams to UpdatePersonDto', () => {
            const params: UpdatePersonBodyParams = {
                stammorganisation: faker.string.uuid(),
                referrer: 'referrer',
                name: {
                    vorname: 'john',
                    familienname: 'doe',
                },
                geburt: {},
                lokalisierung: 'de-DE',
                revision: '1',
            };
            expect(() => sut.map(params, UpdatePersonBodyParams, UpdatePersonDto)).not.toThrow(MappingError);
        });

        it('should map UpdatePersonDto to PersonDo', () => {
            expect(() => sut.map({} as UpdatePersonDto, UpdatePersonDto, PersonDo)).not.toThrow(MappingError);
        });
    });
});

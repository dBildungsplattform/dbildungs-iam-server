import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { FindPersonenkontextByIdParams } from './find-personenkontext-by-id.params.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonDto } from './person.dto.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { PersonenkontextController } from './personenkontext.controller.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { PersonenkontextdatensatzResponse } from './personenkontextdatensatz.response.js';

describe('PersonenkontextController', () => {
    let module: TestingModule;
    let sut: PersonenkontextController;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonenkontextController,
                PersonApiMapperProfile,
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
            ],
        }).compile();
        sut = module.get(PersonenkontextController);
        personenkontextUcMock = module.get(PersonenkontextUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findPersonenkontextById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext response', async () => {
                const params: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };
                const dtoMock: PersonendatensatzDto = {
                    person: new PersonDto(),
                    personenkontexte: [],
                };

                personenkontextUcMock.findPersonenkontextById.mockResolvedValue(dtoMock);

                const response: PersonendatensatzResponse = await sut.findPersonenkontextById(params);

                expect(response).toBeInstanceOf(PersonendatensatzResponse);
                expect(personenkontextUcMock.findPersonenkontextById).toBeCalledTimes(1);
            });
        });

        describe('when NOT finding personenkontext with id', () => {
            it('should throw http error', async () => {
                const params: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextUcMock.findPersonenkontextById.mockRejectedValue(new EntityNotFoundError());

                await expect(sut.findPersonenkontextById(params)).rejects.toThrowError(HttpException);
            });

            it('should throw error', async () => {
                const params: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextUcMock.findPersonenkontextById.mockRejectedValue(new Error());

                await expect(sut.findPersonenkontextById(params)).rejects.toThrowError(Error);
            });
        });
    });

    describe('findPersonenkontexte', () => {
        describe('when finding personenkontexte', () => {
            it('should return personenkontext', async () => {
                const queryParams: PersonenkontextQueryParams = {
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.JA,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                    offset: 0,
                    limit: 10,
                };
                const personenkontext: PersonenkontextDto = {
                    id: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    mandant: faker.string.uuid(),
                    referrer: queryParams.referrer,
                    sichtfreigabe: queryParams.sichtfreigabe,
                    rolle: queryParams.rolle ?? Rolle.LERNENDER,
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    personenstatus: Personenstatus.AKTIV,
                    organisation: {
                        id: faker.string.uuid(),
                    },
                    revision: '1',
                };
                const personenkontexte: Paged<PersonenkontextDto> = {
                    offset: queryParams.offset ?? 0,
                    limit: queryParams.limit ?? 1,
                    total: 1,
                    items: [personenkontext],
                };
                personenkontextUcMock.findAll.mockResolvedValue(personenkontexte);

                const result: PagedResponse<PersonenkontextdatensatzResponse> = await sut.findPersonenkontexte(
                    queryParams,
                );

                expect(personenkontextUcMock.findAll).toBeCalledTimes(1);
                expect(result.items.length).toBe(1);
                expect(result.items[0]?.person.id).toBe(personenkontext.personId);
                expect(result.items[0]?.personenkontexte.length).toBe(1);
                expect(result.items[0]?.personenkontexte[0]?.id).toBe(personenkontext.id);
            });
        });
    });
});

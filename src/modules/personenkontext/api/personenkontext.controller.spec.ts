import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { Paged } from '../../../shared/paging/paged.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { FindPersonenkontextByIdParams } from './find-personenkontext-by-id.params.js';
import { PersonApiMapperProfile } from '../../person/api/person-api.mapper.profile.js';
import { PersonDto } from '../../person/api/person.dto.js';
import { PersonendatensatzDto } from '../../person/api/personendatensatz.dto.js';
import { PersonendatensatzResponse } from '../../person/api/personendatensatz.response.js';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { PersonenkontextController } from './personenkontext.controller.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { PersonenkontextdatensatzResponse } from './personenkontextdatensatz.response.js';
import { UpdatePersonenkontextBodyParams } from './update-personenkontext.body.params.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { DeleteRevisionBodyParams } from '../../person/api/delete-revision.body.params.js';
import { PersonByIdParams } from '../../person/api/person-by-id.param.js';
import { HatSystemrechtBodyParams } from './hat-systemrecht.body.params.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { SystemrechtResponse } from './personenkontext-systemrecht.response.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';

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

                personenkontextUcMock.findPersonenkontextById.mockResolvedValue(
                    new SchulConnexError({} as SchulConnexError),
                );

                await expect(sut.findPersonenkontextById(params)).rejects.toThrow(HttpException);
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

                const result: PagedResponse<PersonenkontextdatensatzResponse> =
                    await sut.findPersonenkontexte(queryParams);

                expect(personenkontextUcMock.findAll).toBeCalledTimes(1);
                expect(result.items.length).toBe(1);
                expect(result.items[0]?.person.id).toBe(personenkontext.personId);
                expect(result.items[0]?.personenkontexte.length).toBe(1);
                expect(result.items[0]?.personenkontexte[0]?.id).toBe(personenkontext.id);
            });
        });
    });

    describe('hatSystemRecht', () => {
        describe('when verifying user has SystemRecht', () => {
            it('should return PersonenkontextSystemrechtResponse', async () => {
                const idParams: PersonByIdParams = {
                    personId: '1',
                };
                const bodyParams: HatSystemrechtBodyParams = {
                    systemRecht: RollenSystemRecht.ROLLEN_VERWALTEN,
                };
                const organisations: OrganisationDo<true>[] = [DoFactory.createOrganisation(true)];
                const personenkontextSystemrechtResponse: SystemrechtResponse = {
                    ROLLEN_VERWALTEN: organisations,
                };
                personenkontextUcMock.hatSystemRecht.mockResolvedValue(personenkontextSystemrechtResponse);
                const response: SystemrechtResponse = await sut.hatSystemRecht(idParams, bodyParams);
                expect(response['ROLLEN_VERWALTEN']).toHaveLength(1);
                expect(personenkontextUcMock.hatSystemRecht).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('updatePersonenkontextWithId', () => {
        describe('when updating a personenkontext is successful', () => {
            it('should return PersonenkontextResponse', async () => {
                const idParams: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };
                const bodyParams: UpdatePersonenkontextBodyParams = {
                    referrer: 'referrer',
                    personenstatus: Personenstatus.AKTIV,
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    revision: '1',
                };
                const mockResonse: PersonendatensatzDto = {
                    person: new PersonDto(),
                    personenkontexte: [new PersonenkontextDto()],
                };

                personenkontextUcMock.updatePersonenkontext.mockResolvedValue(mockResonse);

                const response: PersonendatensatzResponse = await sut.updatePersonenkontextWithId(idParams, bodyParams);

                expect(response).toBeInstanceOf(PersonendatensatzResponse);
                expect(personenkontextUcMock.updatePersonenkontext).toHaveBeenCalledTimes(1);
            });
        });

        describe('when updating a personenkontext returns a SchulConnexError', () => {
            it('should throw HttpException', async () => {
                const idParams: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };
                const bodyParams: UpdatePersonenkontextBodyParams = {
                    referrer: 'referrer',
                    personenstatus: Personenstatus.AKTIV,
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    revision: '1',
                };

                personenkontextUcMock.updatePersonenkontext.mockResolvedValue(
                    new SchulConnexError({} as SchulConnexError),
                );

                await expect(sut.updatePersonenkontextWithId(idParams, bodyParams)).rejects.toThrow(HttpException);
                expect(personenkontextUcMock.updatePersonenkontext).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('deletePersonenkontextById', () => {
        const idParams: FindPersonenkontextByIdParams = {
            personenkontextId: faker.string.uuid(),
        };

        const bodyParams: DeleteRevisionBodyParams = {
            revision: '1',
        };

        describe('when deleting a personenkontext is successful', () => {
            it('should return nothing', async () => {
                personenkontextUcMock.deletePersonenkontextById.mockResolvedValue(undefined);

                const response: void = await sut.deletePersonenkontextById(idParams, bodyParams);

                expect(response).toBeUndefined();
                expect(personenkontextUcMock.deletePersonenkontextById).toHaveBeenCalledTimes(1);
            });
        });

        describe('when deleting a personenkontext returns a SchulConnexError', () => {
            it('should throw HttpException', async () => {
                personenkontextUcMock.deletePersonenkontextById.mockResolvedValue(
                    new SchulConnexError({} as SchulConnexError),
                );

                await expect(sut.deletePersonenkontextById(idParams, bodyParams)).rejects.toThrow(HttpException);
                expect(personenkontextUcMock.deletePersonenkontextById).toHaveBeenCalledTimes(1);
            });
        });
    });
});

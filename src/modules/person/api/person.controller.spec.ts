import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException, HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged, PagedResponse } from '../../../shared/paging/index.js';
import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonenkontextBodyParams } from './create-personenkontext.body.params.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonController } from './person.controller.js';
import { PersonDto } from './person.dto.js';
import { PersonUc } from './person.uc.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personUcMock: DeepMocked<PersonUc>;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;
    const mockBirthParams: PersonBirthParams = {
        datum: faker.date.anytime(),
        geburtsort: faker.string.alpha(),
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonController,
                PersonApiMapperProfile,
                {
                    provide: PersonUc,
                    useValue: createMock<PersonUc>(),
                },
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
            ],
        }).compile();
        personController = module.get(PersonController);
        personUcMock = module.get(PersonUc);
        personenkontextUcMock = module.get(PersonenkontextUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personController).toBeDefined();
    });

    describe('createPerson', () => {
        describe('when creating a person is successful', () => {
            it('should return PersonendatensatzResponse', async () => {
                const personDto: PersonDto = {} as PersonDto;
                personUcMock.createPerson.mockResolvedValue(personDto);

                const params: CreatePersonBodyParams = {
                    username: '',
                    mandant: faker.string.uuid(),
                    name: {
                        vorname: faker.person.firstName(),
                        familienname: faker.person.lastName(),
                    },
                    geburt: {},
                };

                await expect(personController.createPerson(params)).resolves.toBeInstanceOf(PersonendatensatzResponse);
                expect(personUcMock.createPerson).toHaveBeenCalledTimes(1);
            });
        });

        describe('when creating a person is not successful', () => {
            it('should throw HttpException', async () => {
                const error: SchulConnexError = new SchulConnexError({} as SchulConnexError);
                personUcMock.createPerson.mockResolvedValue(error);

                const params: CreatePersonBodyParams = {
                    username: '',
                    mandant: faker.string.uuid(),
                    name: {
                        vorname: faker.person.firstName(),
                        familienname: faker.person.lastName(),
                    },
                    geburt: {},
                };

                await expect(personController.createPerson(params)).rejects.toThrow(HttpException);
                expect(personUcMock.createPerson).toHaveBeenCalledTimes(1);
            });
        });

        describe('when username is given', () => {
            it('should throw BadRequestException', async () => {
                const personDto: PersonDto = {} as PersonDto;
                personUcMock.createPerson.mockResolvedValue(personDto);
                const params: CreatePersonBodyParams = {
                    username: faker.internet.userName(),
                    mandant: faker.string.uuid(),
                    name: {
                        vorname: faker.person.firstName(),
                        familienname: faker.person.lastName(),
                    },
                    geburt: {},
                };
                await expect(personController.createPerson(params)).rejects.toThrow(
                    new BadRequestException('Username will be assigned and is not supported, leave empty.'),
                );
            });
        });
    });

    describe('when getting a person', () => {
        const params: PersonByIdParams = {
            personId: faker.string.uuid(),
        };

        it('should get a person', async () => {
            const personDto: PersonDto = {} as PersonDto;
            const persondatensatzDto: PersonendatensatzDto = {
                person: personDto,
                personenkontexte: [],
            };

            personUcMock.findPersonById.mockResolvedValue(persondatensatzDto);

            await expect(personController.findPersonById(params)).resolves.not.toThrow();

            expect(personUcMock.findPersonById).toHaveBeenCalledTimes(1);
        });

        it('should throw an Http not found exception', async () => {
            personUcMock.findPersonById.mockResolvedValue(new SchulConnexError({} as SchulConnexError));
            await expect(personController.findPersonById(params)).rejects.toThrow(HttpException);
            expect(personUcMock.findPersonById).toHaveBeenCalledTimes(1);
        });
    });

    describe('findPersons', () => {
        const options: {
            referrer: string;
            lastName: string;
            firstName: string;
        } = {
            referrer: faker.string.alpha(),
            lastName: faker.person.lastName(),
            firstName: faker.person.firstName(),
        };
        const queryParams: PersonenQueryParams = {
            referrer: options.referrer,
            familienname: options.lastName,
            vorname: options.firstName,
            sichtfreigabe: SichtfreigabeType.NEIN,
        };

        it('should get all persons', async () => {
            const person1: PersonDto = {
                id: faker.string.uuid(),
                name: {
                    familienname: options.lastName,
                    vorname: options.firstName,
                },
                referrer: options.referrer,
                geburt: mockBirthParams,
                geschlecht: Geschlecht.M,
                lokalisierung: '',
                vertrauensstufe: Vertrauensstufe.VOLL,
            } as PersonDto;
            const person2: PersonDto = {
                id: faker.string.uuid(),
                name: {
                    familienname: options.lastName,
                    vorname: options.firstName,
                },
                referrer: options.referrer,
                geburt: mockBirthParams,
                geschlecht: Geschlecht.M,
                lokalisierung: '',
                vertrauensstufe: Vertrauensstufe.VOLL,
            } as PersonDto;

            const mockPersondatensatz1: PersonendatensatzDto = {
                person: person1,
                personenkontexte: [],
            };
            const mockPersondatensatz2: PersonendatensatzDto = {
                person: person2,
                personenkontexte: [],
            };
            const mockPersondatensatz: PagedResponse<PersonendatensatzDto> = new PagedResponse({
                offset: 0,
                limit: 10,
                total: 2,
                items: [mockPersondatensatz1, mockPersondatensatz2],
            });

            personUcMock.findAll.mockResolvedValue(mockPersondatensatz);

            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(queryParams);

            expect(personUcMock.findAll).toHaveBeenCalledTimes(1);
            expect(result.items.at(0)?.person.referrer).toEqual(queryParams.referrer);
            expect(result.items.at(0)?.person.name.vorname).toEqual(queryParams.vorname);
            expect(result.items.at(0)?.person.name.familienname).toEqual(queryParams.familienname);
            expect(result).toEqual(mockPersondatensatz);
        });
    });

    describe('createPersonenkontext', () => {
        describe('when creating a personenkontext is successful', () => {
            it('should not throw', async () => {
                const pathParams: PersonByIdParams = {
                    personId: faker.string.uuid(),
                };
                const body: CreatePersonenkontextBodyParams = {
                    rolle: Rolle.LEHRENDER,
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    personenstatus: Personenstatus.AKTIV,
                    referrer: 'referrer',
                };
                const ucResult: CreatedPersonenkontextDto = {
                    id: faker.string.uuid(),
                    mandant: faker.string.uuid(),
                    organisation: {
                        id: faker.string.uuid(),
                    },
                    revision: '1',
                    rolle: Rolle.LEHRENDER,
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    personenstatus: Personenstatus.AKTIV,
                    referrer: 'referrer',
                    loeschung: { zeitpunkt: faker.date.past() },
                };
                personenkontextUcMock.createPersonenkontext.mockResolvedValue(ucResult);

                await expect(personController.createPersonenkontext(pathParams, body)).resolves.toBeInstanceOf(
                    PersonenkontextResponse,
                );
                expect(personenkontextUcMock.createPersonenkontext).toHaveBeenCalledTimes(1);
            });
        });

        describe('when creating a personenkontext returns a SchulConnexError', () => {
            it('should throw HttpException', async () => {
                const pathParams: PersonByIdParams = {
                    personId: faker.string.uuid(),
                };
                const body: CreatePersonenkontextBodyParams = {
                    rolle: Rolle.LEHRENDER,
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    personenstatus: Personenstatus.AKTIV,
                    referrer: 'referrer',
                };
                personenkontextUcMock.createPersonenkontext.mockResolvedValue(
                    new SchulConnexError({} as SchulConnexError),
                );

                await expect(personController.createPersonenkontext(pathParams, body)).rejects.toThrow(HttpException);
                expect(personenkontextUcMock.createPersonenkontext).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('findPersonenkontexte', () => {
        describe('When fetching personenkontexte is successful', () => {
            it('should get all personenkontexte', async () => {
                const pathParams: PersonByIdParams = {
                    personId: faker.string.uuid(),
                };
                const queryParams: PersonenkontextQueryParams = {
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                };
                const personenkontextResponse: PersonenkontextDto = {
                    id: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    organisation: {
                        id: faker.string.uuid(),
                    },
                    revision: '1',
                    mandant: faker.string.uuid(),
                    rolle: Rolle.LERNENDER,
                    referrer: 'referrer',
                    jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                    personenstatus: Personenstatus.AKTIV,
                    loeschung: { zeitpunkt: faker.date.past() },
                };
                const personenkontextDtos: Paged<PersonenkontextDto> = {
                    items: [personenkontextResponse],
                    total: 1,
                    offset: 0,
                    limit: 1,
                };

                personenkontextUcMock.findAll.mockResolvedValue(personenkontextDtos);

                const result: PagedResponse<PersonenkontextResponse> = await personController.findPersonenkontexte(
                    pathParams,
                    queryParams,
                );

                expect(personenkontextUcMock.findAll).toHaveBeenCalledTimes(1);
                expect(result.items.length).toBe(1);
                expect(result.items[0]?.id).toBe(personenkontextDtos.items[0]?.id);
            });
        });
    });

    describe('resetPasswordByPersonId', () => {
        describe('when resetting password for a person', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };

            it('should reset password for person', async () => {
                const response: Result<string> = {
                    ok: true,
                    value: faker.string.alphanumeric({ length: { min: 10, max: 10 }, casing: 'mixed' }),
                };

                personUcMock.resetPassword.mockResolvedValueOnce(response);

                await expect(personController.resetPasswordByPersonId(params)).resolves.not.toThrow();
                expect(personUcMock.resetPassword).toHaveBeenCalledTimes(1);
            });
        });

        describe('when resetting password for a person returns a SchulConnexError', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };

            it('should throw HttpException', async () => {
                const response: SchulConnexError = new SchulConnexError({} as SchulConnexError);

                personUcMock.resetPassword.mockResolvedValueOnce(response);

                await expect(personController.resetPasswordByPersonId(params)).rejects.toThrow(HttpException);
                expect(personUcMock.resetPassword).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('updatePerson', () => {
        const params: PersonByIdParams = {
            personId: faker.string.uuid(),
        };
        const body: UpdatePersonBodyParams = {
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

        describe('when updating a person is successful', () => {
            it('should return PersonendatensatzResponse', async () => {
                const personendatensatzDto: PersonendatensatzDto = new PersonendatensatzDto({
                    person: {} as PersonDto,
                    personenkontexte: [],
                });
                personUcMock.updatePerson.mockResolvedValue(personendatensatzDto);

                await expect(personController.updatePerson(params, body)).resolves.toBeInstanceOf(
                    PersonendatensatzResponse,
                );
                expect(personUcMock.updatePerson).toHaveBeenCalledTimes(1);
            });
        });

        describe('when updating a person is not successful', () => {
            it('should throw HttpException', async () => {
                const error: SchulConnexError = new SchulConnexError({} as SchulConnexError);
                personUcMock.updatePerson.mockResolvedValue(error);

                await expect(personController.updatePerson(params, body)).rejects.toThrow(HttpException);
                expect(personUcMock.updatePerson).toHaveBeenCalledTimes(1);
            });
        });
    });
});

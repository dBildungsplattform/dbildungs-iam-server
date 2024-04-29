import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged, PagedResponse } from '../../../shared/paging/index.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../personenkontext/domain/personenkontext.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/create-personenkontext.body.params.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonController } from './person.controller.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/personenkontext-query.params.js';
import { PersonenkontextDto } from '../../personenkontext/api/personenkontext.dto.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
import { PersonenkontextUc } from '../../personenkontext/api/personenkontext.uc.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { Person } from '../domain/person.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { KeycloakClientError } from '../../../shared/error/keycloak-client.error.js';
import { PersonFactory } from '../domain/person.factory.js';
import { PersonUc } from '../domain/person.uc.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationID } from '../../../shared/types/index.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { ConfigService } from '@nestjs/config';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let usernameGeneratorService: DeepMocked<UsernameGeneratorService>;
    let personUcMock: DeepMocked<PersonUc>;
    let personPermissionsMock: DeepMocked<PersonPermissions>;
    //let configServiceMock: DeepMocked<ConfigService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonController,
                PersonFactory,
                PersonApiMapperProfile,
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
                {
                    provide: PersonUc,
                    useValue: createMock<PersonUc>(),
                },
                {
                    provide: ConfigService,
                    useValue: createMock<ConfigService>(),
                },
            ],
        }).compile();
        personController = module.get(PersonController);
        personenkontextUcMock = module.get(PersonenkontextUc);
        personRepositoryMock = module.get(PersonRepository);
        usernameGeneratorService = module.get(UsernameGeneratorService);
        personUcMock = module.get(PersonUc);
        //configServiceMock = module.get(ConfigService);
        personPermissionsMock = createMock<PersonPermissions>();
    });

    function getPerson(): Person<true> {
        return Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            faker.string.uuid(),
        );
    }

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
                const person: Person<true> = getPerson();
                const params: CreatePersonBodyParams = {
                    name: {
                        vorname: person.vorname,
                        familienname: person.familienname,
                    },
                    geburt: {},
                };

                personRepositoryMock.create.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
                await expect(personController.createPerson(params, personPermissionsMock)).resolves.toBeInstanceOf(
                    PersonendatensatzResponse,
                );
                expect(personRepositoryMock.create).toHaveBeenCalledTimes(1);
                const result: PersonendatensatzResponse = await personController.createPerson(
                    params,
                    personPermissionsMock,
                );
                expect(result.person.name.vorname).toEqual(person.vorname);
                expect(result.person.name.familienname).toEqual(person.familienname);
            });
        });

        describe('when creating a person is not successful', () => {
            const params: CreatePersonBodyParams = {
                name: {
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                },
                geburt: {},
            };

            it('should throw HttpException', async () => {
                const person: Person<true> = getPerson();
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([faker.string.uuid()]);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
                const orgaId: OrganisationID[] = [faker.string.uuid()];
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce(orgaId);
                usernameGeneratorService.generateUsername.mockResolvedValue({ ok: true, value: '' });
                personRepositoryMock.create.mockResolvedValue(new KeycloakClientError(''));
                await expect(personController.createPerson(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.create).toHaveBeenCalledTimes(1);
            });

            it('should throw HttpException', async () => {
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([faker.string.uuid()]);
                usernameGeneratorService.generateUsername.mockResolvedValue({
                    ok: false,
                    error: new KeycloakClientError(''),
                });
                await expect(personController.createPerson(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.create).not.toHaveBeenCalled();
            });

            it('should throw HttpException when no user has no PERSONEN_VERWALTEN permission on any organisations', async () => {
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
                await expect(personController.createPerson(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.create).not.toHaveBeenCalled();
            });
        });
    });

    describe('when getting a person', () => {
        const params: PersonByIdParams = {
            personId: faker.string.uuid(),
        };
        const person: Person<true> = getPerson();

        it('should get a person', async () => {
            personRepositoryMock.findById.mockResolvedValue(person);
            personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
            await expect(personController.findPersonById(params, personPermissionsMock)).resolves.not.toThrow();
            expect(personRepositoryMock.findById).toHaveBeenCalledTimes(1);
        });

        it('should throw an Http not found exception', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
            await expect(personController.findPersonById(params, personPermissionsMock)).rejects.toThrow(HttpException);
            expect(personRepositoryMock.findById).toHaveBeenCalledTimes(1);
        });

        it('should throw an HttpNotFoundException when permissions are insufficient', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError() });
            await expect(personController.findPersonById(params, personPermissionsMock)).rejects.toThrow(HttpException);
            expect(personRepositoryMock.findById).toHaveBeenCalledTimes(0);
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
            suchFilter: '',
        };
        const person1: Person<true> = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            'Moritz',
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            faker.string.uuid(),
        );
        const person2: Person<true> = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            faker.string.uuid(),
        );

        it('should get all persons', async () => {
            personRepositoryMock.findBy.mockResolvedValueOnce([[person1, person2], 2]);

            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(
                queryParams,
                personPermissionsMock,
            );
            expect(personRepositoryMock.findBy).toHaveBeenCalledTimes(1);
            expect(result.total).toEqual(2);
            expect(result.limit).toEqual(2);
            expect(result.offset).toEqual(0);
            expect(result.items.length).toEqual(2);
            expect(result.items.at(0)?.person.name.vorname).toEqual('Moritz');
        });

        it('should get all persons when organisationIds is found and is ROOT', async () => {
            personRepositoryMock.findBy.mockResolvedValueOnce([[person1, person2], 2]);
            personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([
                personController.ROOT_ORGANISATION_ID,
            ]);
            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(
                queryParams,
                personPermissionsMock,
            );
            expect(personRepositoryMock.findBy).toHaveBeenCalledTimes(1);
            expect(result.total).toEqual(2);
            expect(result.limit).toEqual(2);
            expect(result.offset).toEqual(0);
            expect(result.items.length).toEqual(2);
            expect(result.items.at(0)?.person.name.vorname).toEqual('Moritz');
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
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: getPerson() });
                await expect(
                    personController.createPersonenkontext(pathParams, body, personPermissionsMock),
                ).resolves.toBeInstanceOf(PersonenkontextResponse);
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
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: getPerson() });

                await expect(
                    personController.createPersonenkontext(pathParams, body, personPermissionsMock),
                ).rejects.toThrow(HttpException);
                expect(personenkontextUcMock.createPersonenkontext).toHaveBeenCalledTimes(1);
            });
        });

        describe('when permissions are insufficient to create personenkontext', () => {
            it('should throw HttpNotFoundException', async () => {
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
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError() });

                await expect(
                    personController.createPersonenkontext(pathParams, body, personPermissionsMock),
                ).rejects.toThrow(HttpException);
                expect(personenkontextUcMock.createPersonenkontext).toHaveBeenCalledTimes(0);
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
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: getPerson() });

                const result: PagedResponse<PersonenkontextResponse> = await personController.findPersonenkontexte(
                    pathParams,
                    queryParams,
                    personPermissionsMock,
                );

                expect(personenkontextUcMock.findAll).toHaveBeenCalledTimes(1);
                expect(result.items.length).toBe(1);
                expect(result.items[0]?.id).toBe(personenkontextDtos.items[0]?.id);
            });
        });

        describe('when permissions are insufficient to fetch personenkontexte', () => {
            it('should throw HttpNotFoundException', async () => {
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
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError() });
                personenkontextUcMock.findAll.mockResolvedValue(personenkontextDtos);
                await expect(
                    personController.findPersonenkontexte(pathParams, queryParams, personPermissionsMock),
                ).rejects.toThrow(HttpException);

                expect(personenkontextUcMock.findAll).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('resetPasswordByPersonId', () => {
        describe('when resetting password for a person', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };
            const person: Person<true> = getPerson();

            it('should reset password for person', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(
                    personController.resetPasswordByPersonId(params, personPermissionsMock),
                ).resolves.not.toThrow();
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(1);
            });
        });

        describe('when resetting password for a person returns a SchulConnexError', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };
            const person: Person<true> = getPerson();

            it('should throw HttpException', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(new KeycloakClientError(''));
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(personController.resetPasswordByPersonId(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(1);
            });
        });

        describe('when person does not exist', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };
            const person: Person<true> = getPerson();

            it('should throw HttpException', async () => {
                personRepositoryMock.findById.mockResolvedValue(undefined);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(personController.resetPasswordByPersonId(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });

        describe('when permissions are insufficient to reset user-password', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };
            const person: Person<true> = getPerson();

            it('should throw HttpNotFoundException', async () => {
                personRepositoryMock.findById.mockResolvedValue(undefined);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError() });

                await expect(personController.resetPasswordByPersonId(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
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
            const person: Person<true> = getPerson();

            it('should return PersonendatensatzResponse', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(
                    personController.updatePerson(params, body, personPermissionsMock),
                ).resolves.toBeInstanceOf(PersonendatensatzResponse);
                expect(personRepositoryMock.findById).toHaveBeenCalledTimes(1);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(1);
            });
        });

        describe('when person does not exist', () => {
            const person: Person<true> = getPerson();

            it('should throw HttpException', async () => {
                personRepositoryMock.findById.mockResolvedValue(undefined);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(personController.updatePerson(params, body, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.findById).toHaveBeenCalledTimes(1);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });

        describe('when revision does not match', () => {
            const person: Person<true> = getPerson();
            person.revision = '10';

            it('should throw HttpException', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(personController.updatePerson(params, body, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.findById).toHaveBeenCalledTimes(1);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });

        describe('when permissions are insufficient to update user', () => {
            const person: Person<true> = getPerson();
            person.revision = '10';

            it('should throw HttpNotFoundException', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personUcMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: false, error: new EntityNotFoundError() });

                await expect(personController.updatePerson(params, body, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.findById).toHaveBeenCalledTimes(0);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });
    });
});

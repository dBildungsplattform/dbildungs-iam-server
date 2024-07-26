import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged, PagedResponse } from '../../../shared/paging/index.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../personenkontext/domain/personenkontext.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/param/create-personenkontext.body.params.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonController } from './person.controller.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/param/personenkontext-query.params.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { PersonenkontextUc } from '../../personenkontext/api/personenkontext.uc.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { Person } from '../domain/person.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { KeycloakClientError } from '../../../shared/error/keycloak-client.error.js';
import { PersonFactory } from '../domain/person.factory.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationID } from '../../../shared/types/index.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { ConfigService } from '@nestjs/config';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextService } from '../../personenkontext/domain/personenkontext.service.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let usernameGeneratorService: DeepMocked<UsernameGeneratorService>;
    let personenkontextServiceMock: DeepMocked<PersonenkontextService>;

    let personPermissionsMock: DeepMocked<PersonPermissions>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonController,
                PersonFactory,
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
                    provide: ConfigService,
                    useValue: createMock<ConfigService>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonenkontextService,
                    useValue: createMock<PersonenkontextService>(),
                },
            ],
        }).compile();
        personController = module.get(PersonController);
        personenkontextUcMock = module.get(PersonenkontextUc);
        personRepositoryMock = module.get(PersonRepository);
        usernameGeneratorService = module.get(UsernameGeneratorService);
        personenkontextServiceMock = module.get(PersonenkontextService);
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
        describe('when is authorized migration call with username & password', () => {
            it('should return PersonendatensatzResponse', async () => {
                const person: Person<true> = getPerson();
                const params: CreatePersonBodyParams = {
                    name: {
                        vorname: person.vorname,
                        familienname: person.familienname,
                    },
                    geburt: {},
                    username: 'fixedusername',
                    hashedPassword: '{crypt}$6$TDByqqy.tqrqUUE0$px4z5v4gOTKY',
                };
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([faker.string.uuid()]);
                personRepositoryMock.create.mockResolvedValue(person);
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
        describe('when is not authorized migration call with username & password', () => {
            it('should return error', async () => {
                const person: Person<true> = getPerson();
                const params: CreatePersonBodyParams = {
                    name: {
                        vorname: person.vorname,
                        familienname: person.familienname,
                    },
                    geburt: {},
                    username: 'fixedusername',
                    hashedPassword: '{crypt}$6$TDByqqy.tqrqUUE0$px4z5v4gOTKY',
                };
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([]);
                personRepositoryMock.create.mockResolvedValue(person);
                await expect(personController.createPerson(params, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
            });
        });
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
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([faker.string.uuid()]);
                personRepositoryMock.create.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
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
            personPermissionsMock = createMock<PersonPermissions>();
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
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
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

    describe('deletePerson', () => {
        const person: Person<true> = getPerson();
        const deleteParams: PersonByIdParams = {
            personId: person.id,
        };
        describe('when deleting a person is successful', () => {
            it('should return no error ', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
                personRepositoryMock.deletePerson.mockResolvedValueOnce({ ok: true, value: undefined });

                const response: void = await personController.deletePersonById(deleteParams, personPermissionsMock);

                expect(response).toBeUndefined();
                expect(personRepositoryMock.deletePerson).toHaveBeenCalledTimes(1);
            });
        });
        describe('when deleting a person returns a SchulConnexError', () => {
            it('should throw HttpException', async () => {
                personRepositoryMock.deletePerson.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });
                await expect(personController.deletePersonById(deleteParams, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
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
            personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });
            await expect(personController.findPersonById(params, personPermissionsMock)).resolves.not.toThrow();
        });

        it('should throw an HttpNotFoundException when permissions are insufficient', async () => {
            personRepositoryMock.findById.mockResolvedValue(undefined);
            personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                ok: false,
                error: new EntityNotFoundError(),
            });
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
        personPermissionsMock = createMock<PersonPermissions>();

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
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: getPerson() });
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
                personPermissionsMock = createMock<PersonPermissions>();

                personenkontextUcMock.createPersonenkontext.mockResolvedValue(
                    new SchulConnexError({} as SchulConnexError),
                );
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: getPerson() });

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
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });
                personPermissionsMock = createMock<PersonPermissions>();

                await expect(
                    personController.createPersonenkontext(pathParams, body, personPermissionsMock),
                ).rejects.toThrow(HttpException);
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
                const personenkontextResponse: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                const personenkontextDtos: Paged<Personenkontext<true>> = {
                    items: [personenkontextResponse],
                    total: 1,
                    offset: 0,
                    limit: 1,
                };
                personPermissionsMock = createMock<PersonPermissions>();

                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue(personenkontextDtos);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: getPerson() });

                const result: PagedResponse<PersonenkontextResponse> = await personController.findPersonenkontexte(
                    pathParams,
                    queryParams,
                    personPermissionsMock,
                );

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
                const personenkontextResponse: Personenkontext<true> = DoFactory.createPersonenkontext(true);

                const personenkontextDtos: Paged<Personenkontext<true>> = {
                    items: [personenkontextResponse],
                    total: 1,
                    offset: 0,
                    limit: 1,
                };
                personPermissionsMock = createMock<PersonPermissions>();

                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue(personenkontextDtos);
                await expect(
                    personController.findPersonenkontexte(pathParams, queryParams, personPermissionsMock),
                ).rejects.toThrow(HttpException);
            });
        });
    });

    describe('resetPasswordByPersonId', () => {
        describe('when resetting password for a person', () => {
            const params: PersonByIdParams = {
                personId: faker.string.uuid(),
            };
            const person: Person<true> = getPerson();
            personPermissionsMock = createMock<PersonPermissions>();

            it('should reset password for person', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

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
            personPermissionsMock = createMock<PersonPermissions>();

            it('should throw HttpException', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(new KeycloakClientError(''));
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

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
            personPermissionsMock = createMock<PersonPermissions>();

            it('should throw HttpException', async () => {
                personRepositoryMock.findBy.mockResolvedValue([[], 0]);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });

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
            personPermissionsMock = createMock<PersonPermissions>();

            it('should throw HttpNotFoundException', async () => {
                personRepositoryMock.findById.mockResolvedValue(undefined);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });

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
        personPermissionsMock = createMock<PersonPermissions>();

        describe('when updating a person is successful', () => {
            const person: Person<true> = getPerson();

            it('should return PersonendatensatzResponse', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(
                    personController.updatePerson(params, body, personPermissionsMock),
                ).resolves.toBeInstanceOf(PersonendatensatzResponse);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(1);
            });
        });

        describe('when person does not exist', () => {
            const person: Person<true> = getPerson();

            it('should throw HttpException', async () => {
                personRepositoryMock.findBy.mockResolvedValue([[], 0]);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });

                await expect(personController.updatePerson(params, body, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });

        describe('when revision does not match', () => {
            const person: Person<true> = getPerson();
            person.revision = '10';

            it('should throw HttpException', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({ ok: true, value: person });

                await expect(personController.updatePerson(params, body, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                //expect(personRepositoryMock.findById).toHaveBeenCalledTimes(1);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });

        describe('when permissions are insufficient to update user', () => {
            const person: Person<true> = getPerson();
            person.revision = '10';

            it('should throw HttpNotFoundException', async () => {
                personRepositoryMock.findById.mockResolvedValue(person);
                personRepositoryMock.update.mockResolvedValue(person);
                personRepositoryMock.getPersonIfAllowed.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });

                await expect(personController.updatePerson(params, body, personPermissionsMock)).rejects.toThrow(
                    HttpException,
                );
                expect(personRepositoryMock.findById).toHaveBeenCalledTimes(0);
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });
    });
});

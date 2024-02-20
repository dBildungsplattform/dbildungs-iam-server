import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { EntityNotFoundError, KeycloakClientError, PersonAlreadyExistsError } from '../../../shared/error/index.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged } from '../../../shared/paging/index.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonService } from '../domain/person.service.js';
import { SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';
import { PersonenkontextService } from '../../personenkontext/domain/personenkontext.service.js';
import { CreatePersonDto } from './create-person.dto.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonUc } from './person.uc.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { UpdatePersonDto } from './update-person.dto.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';
import { Person } from '../domain/person.js';
import { PersonDto } from './person.dto.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';

describe('PersonUc', () => {
    let module: TestingModule;
    let personUc: PersonUc;
    let personServiceMock: DeepMocked<PersonService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personenkontextServiceMock: DeepMocked<PersonenkontextService>;
    let kcUserServiceMock: DeepMocked<KeycloakUserService>;
    let usernameGeneratorService: DeepMocked<UsernameGeneratorService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ConfigTestModule, DatabaseTestModule.forRoot(), LoggerModule.register('Test')],
            providers: [
                PersonUc,
                PersonApiMapperProfile,
                {
                    provide: PersonenkontextService,
                    useValue: createMock<PersonenkontextService>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: Person,
                    useValue: createMock<Person<false>>(),
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
                {
                    provide: PersonService,
                    useValue: createMock<PersonService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        personUc = module.get(PersonUc);
        personServiceMock = module.get(PersonService);
        personRepositoryMock = module.get(PersonRepository);
        personenkontextServiceMock = module.get(PersonenkontextService);
        kcUserServiceMock = module.get(KeycloakUserService);
        usernameGeneratorService = module.get(UsernameGeneratorService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personUc).toBeDefined();
    });

    describe('createPerson', () => {
        beforeEach(() => {
            jest.resetAllMocks();
            jest.resetModules();
        });

        it('should fail when there is no first name given', async () => {
            await expect(personUc.createPerson({} as CreatePersonDto)).resolves.toStrictEqual(
                new SchulConnexError({
                    titel: 'Anfrage unvollständig',
                    code: 400,
                    subcode: '00',
                    beschreibung: 'Vorname nicht angegeben, wird für die Erzeugung des Benutzernamens gebraucht',
                }),
            );
        });
        it('should fail when there is no last name given', async () => {
            await expect(personUc.createPerson({ vorname: 'Horst' } as CreatePersonDto)).resolves.toStrictEqual(
                new SchulConnexError({
                    titel: 'Anfrage unvollständig',
                    code: 400,
                    subcode: '00',
                    beschreibung: 'Nachname nicht angegeben, wird für die Erzeugung des Benutzernamens gebraucht',
                }),
            );
        });

        it('should fail when KeyCloak cant save user', async () => {
            const createPersonDto: CreatePersonDto = { vorname: 'Test', familienname: 'User' };

            usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');
            kcUserServiceMock.create.mockResolvedValueOnce({
                ok: false,
                error: new KeycloakClientError(''),
            });

            const result: PersonDto | SchulConnexError = await personUc.createPerson(createPersonDto);

            expect(result).toEqual(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new KeycloakClientError(`Can't save user`)),
            );
        });

        describe('when saveUser returns undefined keycloakUserId', () => {
            it('should return SchulConnex Error', async () => {
                const createPersonDto: CreatePersonDto = { vorname: 'Test', familienname: 'User' };
                usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');
                kcUserServiceMock.create.mockResolvedValueOnce({
                    ok: true,
                    value: undefined as unknown as string,
                });
                kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                    ok: true,
                    value: '',
                });
                kcUserServiceMock.delete.mockResolvedValueOnce({ ok: true, value: undefined });
                personServiceMock.createPerson.mockResolvedValueOnce({
                    ok: false,
                    error: new PersonAlreadyExistsError(''),
                });

                const result: PersonDto | SchulConnexError = await personUc.createPerson(createPersonDto);

                expect(result).toBeInstanceOf(SchulConnexError);
            });
        });

        describe('when personService createPerson succeeds', () => {
            it('should return PersonDto', async () => {
                const createPersonDto: CreatePersonDto = { vorname: 'Test', familienname: 'User' };
                usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');
                kcUserServiceMock.create.mockResolvedValueOnce({
                    ok: true,
                    value: '',
                });
                kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                    ok: true,
                    value: '',
                });
                kcUserServiceMock.delete.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });
                personServiceMock.createPerson.mockResolvedValueOnce({
                    ok: true,
                    value: new PersonDo<true>(),
                });

                const result: PersonDto | SchulConnexError = await personUc.createPerson(createPersonDto);

                expect(result).toBeInstanceOf(PersonDto);
            });
        });

        describe('when personService createPerson fails', () => {
            it('should delete keycloak user', async () => {
                const createPersonDto: CreatePersonDto = { vorname: 'Test', familienname: 'User' };
                usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');
                kcUserServiceMock.create.mockResolvedValueOnce({
                    ok: true,
                    value: '',
                });
                kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                    ok: true,
                    value: '',
                });
                kcUserServiceMock.delete.mockResolvedValueOnce({ ok: true, value: undefined });
                personServiceMock.createPerson.mockResolvedValueOnce({
                    ok: false,
                    error: new PersonAlreadyExistsError(''),
                });

                await personUc.createPerson(createPersonDto);

                expect(kcUserServiceMock.delete).toHaveBeenCalledTimes(1);
            });

            describe('when person already exists and user can be deleted', () => {
                it('should return SchulConnexError', async () => {
                    const createPersonDto: CreatePersonDto = { vorname: 'Test', familienname: 'User' };
                    usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');
                    kcUserServiceMock.create.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.delete.mockResolvedValueOnce({
                        ok: true,
                        value: undefined,
                    });
                    personServiceMock.createPerson.mockResolvedValueOnce({
                        ok: false,
                        error: new PersonAlreadyExistsError(''),
                    });

                    const result: PersonDto | SchulConnexError = await personUc.createPerson(createPersonDto);

                    expect(result).toBeInstanceOf(SchulConnexError);
                    if (result instanceof SchulConnexError) {
                        expect(result.code).toEqual(400);
                    }
                });
            });
            describe('when person already exists and user could not be deleted', () => {
                it('should return SchulConnexError', async () => {
                    const createPersonDto: CreatePersonDto = { vorname: 'Test', familienname: 'User' };
                    usernameGeneratorService.generateUsername.mockResolvedValueOnce('testusername');
                    kcUserServiceMock.create.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                        ok: true,
                        value: '',
                    });
                    kcUserServiceMock.delete.mockResolvedValueOnce({
                        ok: false,
                        error: new KeycloakClientError(''),
                    });
                    personServiceMock.createPerson.mockResolvedValueOnce({
                        ok: false,
                        error: new PersonAlreadyExistsError(''),
                    });

                    const result: PersonDto | SchulConnexError = await personUc.createPerson(createPersonDto);

                    expect(result).toBeInstanceOf(SchulConnexError);
                    if (result instanceof SchulConnexError) {
                        expect(result.code).toEqual(500);
                    }
                });
            });
        });
    });

    describe('findPersonById', () => {
        const id: string = faker.string.uuid();

        describe('when person exists', () => {
            it('should find a person by an ID', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: true,
                    value: DoFactory.createPerson(true),
                });
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue({
                    items: [DoFactory.createPersonenkontext(true)],
                    total: 1,
                    limit: 1,
                    offset: 0,
                });

                await expect(personUc.findPersonById(id)).resolves.not.toThrow();
                expect(personenkontextServiceMock.findAllPersonenkontexte).toHaveBeenCalledTimes(1);
            });
        });

        describe('when person does not exist', () => {
            it('should return SchulConnexError', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError(''),
                });

                await expect(personUc.findPersonById(id)).resolves.toBeInstanceOf(SchulConnexError);
            });
        });

        describe('When no personenkontexte are found', () => {
            it('should not throw', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: true,
                    value: DoFactory.createPerson(true),
                });

                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue({
                    items: [],
                    total: 0,
                    limit: 0,
                    offset: 0,
                });
                await expect(personUc.findPersonById(id)).resolves.not.toThrow();
                expect(personenkontextServiceMock.findAllPersonenkontexte).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('findAll', () => {
        const personDTO: FindPersonendatensatzDto = {
            referrer: '',
            familienname: '',
            vorname: '',
            sichtfreigabe: SichtfreigabeType.NEIN,
        };

        it('should find all persons that match with query param', async () => {
            const firstPerson: PersonDo<true> = DoFactory.createPerson(true);
            const secondPerson: PersonDo<true> = DoFactory.createPerson(true);
            const persons: Paged<PersonDo<true>> = {
                offset: 0,
                limit: 10,
                total: 2,
                items: [firstPerson, secondPerson],
            };

            personServiceMock.findAllPersons.mockResolvedValue(persons);
            personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue({
                items: [DoFactory.createPersonenkontext(true)],
                total: 1,
                limit: 1,
                offset: 0,
            });

            const result: Paged<PersonendatensatzDto> = await personUc.findAll(personDTO);

            expect(personenkontextServiceMock.findAllPersonenkontexte).toHaveBeenCalledTimes(2);
            expect(result.items).toHaveLength(2);
            expect(result.items.at(0)?.person.name.vorname).toEqual(firstPerson.vorname);
            expect(result.items.at(0)?.person.name.familienname).toEqual(firstPerson.familienname);
            expect(result.items.at(1)?.person.name.vorname).toEqual(secondPerson.vorname);
            expect(result.items.at(1)?.person.name.familienname).toEqual(secondPerson.familienname);
        });

        it('should return an empty array when no matching persons are found', async () => {
            const emptyResult: Paged<PersonDo<true>> = { offset: 0, limit: 0, total: 0, items: [] };

            personServiceMock.findAllPersons.mockResolvedValue(emptyResult);

            const result: Paged<PersonendatensatzDto> = await personUc.findAll(personDTO);

            expect(result.items).toEqual([]);
        });
    });

    describe('resetPassword', () => {
        describe('when personId is valid (person exists)', () => {
            it('should return new Password', async () => {
                const person: Person<true> = Person.construct(
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
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: true,
                    value: new PersonDo<true>(),
                });
                personRepositoryMock.findByKeycloakUserId.mockResolvedValue(person);
                kcUserServiceMock.resetPassword.mockResolvedValueOnce({
                    ok: true,
                    value: '',
                });
                const result: Result<string> | SchulConnexError = await personUc.resetPassword(faker.string.uuid());

                expect(result).not.toBeInstanceOf(SchulConnexError);
                if (!(result instanceof SchulConnexError)) {
                    expect(result.ok).toBeTruthy();
                }
            });
        });

        describe('when person for KeyCLoakUserId can not be found', () => {
            it('should return SchulConnexError', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: true,
                    value: new PersonDo<true>(),
                });
                personRepositoryMock.findByKeycloakUserId.mockResolvedValue(undefined);

                const result: Result<string> | SchulConnexError = await personUc.resetPassword('ABC');

                expect(result).toBeInstanceOf(SchulConnexError);
            });
        });

        describe('when PersonService returns an error', () => {
            beforeEach(() => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: false,
                    error: new KeycloakClientError('Something broke'),
                });
            });

            it('should translate domain errors thrown by the person service', async () => {
                await expect(personUc.resetPassword(faker.string.uuid())).resolves.toBeInstanceOf(SchulConnexError);
            });
        });

        describe('when UserService throws an error', () => {
            beforeEach(() => {
                personServiceMock.findPersonById.mockRejectedValue(new Error('Something wicked this way cometh'));
            });

            it('should pass Errors on', async () => {
                const resetResult: Result<string> | SchulConnexError = await personUc.resetPassword('fakeID1');
                const result: { ok: boolean; error: Error } = resetResult as { ok: boolean; error: Error };
                expect(result.ok).toBeFalsy();
                expect(result.error).toStrictEqual(new Error('Something wicked this way cometh'));
            });
        });

        describe('when UserService throws an something weird', () => {
            beforeEach(() => {
                personServiceMock.findPersonById.mockRejectedValue('By the pricking of my thumbs');
            });

            it('should pass Errors on', async () => {
                const resetResult: Result<string> | SchulConnexError = await personUc.resetPassword('fakeID1');
                const result: { ok: boolean; error: Error } = resetResult as { ok: boolean; error: Error };
                expect(result.ok).toBeFalsy();
                expect(result.error).toStrictEqual(new Error('Unknown error occurred'));
            });
        });
    });

    describe('updatePerson', () => {
        describe('when person exists', () => {
            it('should return PersonendatensatzDto', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                personServiceMock.updatePerson.mockResolvedValueOnce({
                    ok: true,
                    value: personDo,
                });

                const result: PersonendatensatzDto | SchulConnexError = await personUc.updatePerson(
                    {} as UpdatePersonDto,
                );

                expect(result).toBeInstanceOf(PersonendatensatzDto);
                expect(personServiceMock.updatePerson).toHaveBeenCalledTimes(1);
            });
        });

        describe('when person does not exist', () => {
            it('should return SchulConnexError', async () => {
                personServiceMock.updatePerson.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError('Person'),
                });

                await expect(personUc.updatePerson({} as UpdatePersonDto)).resolves.toBeInstanceOf(SchulConnexError);
                expect(personServiceMock.updatePerson).toHaveBeenCalledTimes(1);
            });
        });
    });
});

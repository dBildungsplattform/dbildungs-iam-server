import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { EntityNotFoundError, KeycloakClientError, PersonAlreadyExistsError } from '../../../shared/error/index.js';
import { Paged } from '../../../shared/paging/index.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonService } from '../domain/person.service.js';
import { SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonDto } from './create-person.dto.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonUc } from './person.uc.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { UserRepository } from '../../user/user.repository.js';
import { User } from '../../user/user.js';

describe('PersonUc', () => {
    let module: TestingModule;
    let personUc: PersonUc;
    let personServiceMock: DeepMocked<PersonService>;
    let personenkontextServiceMock: DeepMocked<PersonenkontextService>;
    let userServiceMock: DeepMocked<KeycloakUserService>;
    let userRepositoryMock: DeepMocked<UserRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ConfigTestModule, DatabaseTestModule.forRoot()],
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
                    provide: PersonService,
                    useValue: createMock<PersonService>(),
                },
                { provide: UserRepository, useValue: createMock<UserRepository>() },
            ],
        }).compile();
        personUc = module.get(PersonUc);
        personServiceMock = module.get(PersonService);
        personenkontextServiceMock = module.get(PersonenkontextService);
        userServiceMock = module.get(KeycloakUserService);
        userRepositoryMock = module.get(UserRepository);
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
        describe('when person and user do not exist', () => {
            it('should create a new person', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                userServiceMock.create.mockResolvedValueOnce({ ok: true, value: personDo.keycloakUserId });
                personServiceMock.createPerson.mockResolvedValue({
                    ok: true,
                    value: personDo,
                });

                const createPersonPromise: Promise<unknown> = personUc.createPerson({
                    vorname: 'Hubert',
                    familienname: 'Klobelburg',
                } as CreatePersonDto);

                await expect(createPersonPromise).resolves.not.toThrow();
            });
        });

        describe('when user in keycloak already exists', () => {
            it('should throw Error', async () => {
                const error: PersonAlreadyExistsError = new PersonAlreadyExistsError('');
                userServiceMock.create.mockResolvedValueOnce({ ok: false, error });
                userRepositoryMock.createUser.mockResolvedValueOnce(new User('', '', ''));

                const createPersonPromise: Promise<unknown> = personUc.createPerson({
                    vorname: 'Hans',
                    familienname: 'Dampf',
                } as CreatePersonDto);

                await expect(createPersonPromise).rejects.toThrow(error);
            });
        });

        describe('when person already exists and user can be deleted', () => {
            it('should throw PersonAlreadyExistsError', async () => {
                userServiceMock.create.mockResolvedValueOnce({ ok: true, value: faker.string.uuid() });
                personServiceMock.createPerson.mockResolvedValue({
                    ok: false,
                    error: new PersonAlreadyExistsError(''),
                });
                userRepositoryMock.createUser.mockResolvedValueOnce(new User('', '', ''));

                const createPersonPromise: Promise<unknown> = personUc.createPerson({
                    vorname: 'Gibbet',
                    familienname: 'Nich',
                } as CreatePersonDto);

                await expect(createPersonPromise).rejects.toThrowError(PersonAlreadyExistsError);
            });
        });

        describe('when person already exists and user could not be deleted', () => {
            it('should throw PersonAlreadyExistsError', async () => {
                userServiceMock.create.mockResolvedValueOnce({ ok: true, value: faker.string.uuid() });
                userServiceMock.delete.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Could not delete user'),
                });
                userRepositoryMock.createUser.mockResolvedValueOnce(new User('', '', ''));
                userServiceMock.resetPassword.mockResolvedValueOnce({ ok: true, value: 'acbdabfsads' });
                personServiceMock.createPerson.mockResolvedValue({
                    ok: false,
                    error: new PersonAlreadyExistsError(''),
                });

                const createPromise: Promise<unknown> = personUc.createPerson({
                    vorname: 'Gibbet',
                    familienname: 'Nich',
                } as CreatePersonDto);

                await expect(createPromise).rejects.toThrowError(KeycloakClientError);
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
            it('should throw a person does not exist exception', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError(''),
                });
                await expect(personUc.findPersonById(id)).rejects.toThrowError(EntityNotFoundError);
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
        const id: string = faker.string.uuid();
        describe('when personId is valid (person exists)', () => {
            it('should return a generated password caused by password-reset', async () => {
                const result: Result<string> = {
                    ok: true,
                    value: faker.string.alphanumeric({ length: { min: 10, max: 10 }, casing: 'mixed' }),
                };
                userServiceMock.resetPasswordByPersonId.mockResolvedValueOnce(result);
                await expect(personUc.resetPassword(id)).resolves.not.toThrow();
                expect(userServiceMock.resetPasswordByPersonId).toHaveBeenCalledTimes(1);
            });
        });
    });
});

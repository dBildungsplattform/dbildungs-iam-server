import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdminClient, UserRepresentation } from '@s3pweb/keycloak-admin-client-cjs';

import { faker } from '@faker-js/faker';
import { ConfigTestModule, DoFactory, LoggingTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { DomainError, EntityNotFoundError, KeycloakClientError } from '../../../shared/error/index.js';
import { KeycloakAdministrationService } from './keycloak-admin-client.service.js';
import { UserMapperProfile } from './keycloak-client/user.mapper.profile.js';
import { type FindUserFilter, KeycloakUserService } from './keycloak-user.service.js';
import { UserDo } from './user.do.js';
import { PersonService } from '../../person/domain/person.service.js';
import { PersonDo } from '../../person/domain/person.do.js';

describe('KeycloakUserService', () => {
    let module: TestingModule;
    let service: KeycloakUserService;
    let adminService: DeepMocked<KeycloakAdministrationService>;
    let kcUsersMock: DeepMocked<KeycloakAdminClient['users']>;
    let personService: DeepMocked<PersonService>;

    beforeAll(async () => {
        kcUsersMock = createMock<KeycloakAdminClient['users']>();

        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, LoggingTestModule],
            providers: [
                KeycloakUserService,
                UserMapperProfile,
                {
                    provide: KeycloakAdministrationService,
                    useValue: createMock<KeycloakAdministrationService>({
                        getAuthedKcAdminClient() {
                            return Promise.resolve({
                                ok: true,
                                value: createMock<KeycloakAdminClient>({
                                    users: kcUsersMock,
                                }),
                            });
                        },
                    }),
                },
                {
                    provide: PersonService,
                    useValue: createMock<PersonService>(),
                },
            ],
        }).compile();
        personService = module.get(PersonService);
        service = module.get(KeycloakUserService);
        adminService = module.get(KeycloakAdministrationService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createUser', () => {
        describe('when user does not exist', () => {
            it('should return user id', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.create.mockResolvedValueOnce({ id: user.id });

                const res: Result<string> = await service.create({
                    id: undefined,
                    createdDate: undefined,
                    username: user.username,
                    email: user.email,
                });

                expect(res).toStrictEqual<Result<string>>({
                    ok: true,
                    value: user.id,
                });
            });
        });

        describe('when user is created with password', () => {
            it('should call KeycloakAdminClient.users.create with correct props', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                const password: string = faker.internet.password();
                kcUsersMock.create.mockResolvedValueOnce({ id: user.id });

                await service.create(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    password,
                );

                expect(kcUsersMock.create).toHaveBeenCalledWith({
                    username: user.username,
                    email: user.email,
                    enabled: true,
                    credentials: [{ type: 'password', value: password, temporary: false }],
                });
            });
        });

        describe('when username and email already exists', () => {
            it('should return error result', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.find.mockResolvedValueOnce([
                    {
                        username: user.username,
                        email: user.email,
                        id: user.id,
                        createdTimestamp: user.createdDate.getTime(),
                    },
                ] as unknown as UserRepresentation[]);

                const res: Result<string> = await service.create({
                    id: undefined,
                    createdDate: undefined,
                    username: user.username,
                    email: user.email,
                });

                expect(res).toStrictEqual<Result<string>>({
                    ok: false,
                    error: new KeycloakClientError('Username or email already exists'),
                });
            });
        });

        describe('when user could not be created', () => {
            it('should return error result', async () => {
                kcUsersMock.create.mockRejectedValueOnce(new Error());
                const user: UserDo<false> = DoFactory.createUser(false);

                const res: Result<string> = await service.create(user);

                expect(res).toStrictEqual<Result<string>>({
                    ok: false,
                    error: new KeycloakClientError('Could not create user'),
                });
            });
        });

        describe('when getAuthedKcAdminClient fails', () => {
            it('should pass along error result', async () => {
                const error: Result<KeycloakAdminClient, DomainError> = {
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                };

                adminService.getAuthedKcAdminClient.mockResolvedValueOnce(error);
                const user: UserDo<false> = DoFactory.createUser(false);

                const res: Result<string> = await service.create(user);

                expect(res).toBe(error);
            });
        });
    });

    describe('delete', () => {
        it('should return ok result if user exists', async () => {
            kcUsersMock.del.mockResolvedValueOnce();

            const result: Result<void> = await service.delete(faker.string.uuid());

            expect(result).toStrictEqual<Result<void>>({
                ok: true,
                value: undefined,
            });
        });

        it('should return error result if client.users.del throws', async () => {
            kcUsersMock.del.mockRejectedValueOnce(new Error('User does not exist'));

            const result: Result<void> = await service.delete(faker.string.uuid());

            expect(result).toStrictEqual<Result<void>>({
                ok: false,
                error: new KeycloakClientError('Keycloak request failed'),
            });
        });

        it('should return error result of getAuthedKcAdminClient', async () => {
            const error: Result<KeycloakAdminClient, DomainError> = {
                ok: false,
                error: new KeycloakClientError('Could not authenticate'),
            };
            adminService.getAuthedKcAdminClient.mockResolvedValueOnce(error);

            const result: Result<void> = await service.delete(faker.string.uuid());

            expect(result).toBe(error);
        });
    });

    describe('findById', () => {
        describe('when user exists', () => {
            it('should return result with UserDo', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.findOne.mockResolvedValueOnce({
                    username: user.username,
                    email: user.email,
                    id: user.id,
                    createdTimestamp: user.createdDate.getTime(),
                } as unknown as UserRepresentation);

                const res: Result<UserDo<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: true,
                    value: user,
                });
            });
        });

        describe('when user does not exist', () => {
            it('should return error result', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.findOne.mockResolvedValueOnce(undefined);

                const res: Result<UserDo<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new EntityNotFoundError(`Keycloak User with the following ID ${user.id} does not exist`),
                });
            });
        });

        describe('when getAuthedKcAdminClient fails', () => {
            it('should pass along error result', async () => {
                const error: Result<KeycloakAdminClient, DomainError> = {
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                };

                adminService.getAuthedKcAdminClient.mockResolvedValueOnce(error);
                const user: UserDo<true> = DoFactory.createUser(true);

                const res: Result<UserDo<true>> = await service.findById(user.id);

                expect(res).toBe(error);
            });
        });

        describe('when KeycloakAdminClient throws', () => {
            it('should return error result', async () => {
                kcUsersMock.findOne.mockRejectedValueOnce(new Error());
                const user: UserDo<true> = DoFactory.createUser(true);

                const res: Result<UserDo<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Keycloak request failed'),
                });
            });
        });

        describe('when KeycloakAdminClient.findOne returns invalid data', () => {
            it('should return error result', async () => {
                kcUsersMock.findOne.mockResolvedValueOnce({
                    username: 'TEST',
                });
                const user: UserDo<true> = DoFactory.createUser(true);

                const res: Result<UserDo<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Response is invalid'),
                });
            });
        });
    });

    describe('findOne', () => {
        describe('when user exists', () => {
            it('should return result with UserDo', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.find.mockResolvedValueOnce([
                    {
                        username: user.username,
                        email: user.email,
                        id: user.id,
                        createdTimestamp: user.createdDate.getTime(),
                    },
                ] as unknown as UserRepresentation[]);

                const res: Result<UserDo<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: true,
                    value: user,
                });
            });
        });

        describe('when user does not exist', () => {
            it('should return error result', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.find.mockResolvedValueOnce([]);

                const res: Result<UserDo<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new EntityNotFoundError('Keycloak User could not be found'),
                });
            });
        });

        describe('when getAuthedKcAdminClient fails', () => {
            it('should pass along error result', async () => {
                const error: Result<KeycloakAdminClient, DomainError> = {
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                };

                adminService.getAuthedKcAdminClient.mockResolvedValueOnce(error);
                const user: UserDo<true> = DoFactory.createUser(true);

                const res: Result<UserDo<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toBe(error);
            });
        });

        describe('when KeycloakAdminClient throws', () => {
            it('should return error result', async () => {
                kcUsersMock.find.mockRejectedValueOnce(new Error());
                const user: UserDo<true> = DoFactory.createUser(true);
                const res: Result<UserDo<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Keycloak request failed'),
                });
            });
        });
    });

    describe('resetPassword', () => {
        describe('will be executed successfully', () => {
            it('should return result with ok:true and new password', async () => {
                const userId: string = faker.string.numeric();
                const generatedPassword: string = faker.string.alphanumeric({
                    length: { min: 10, max: 10 },
                    casing: 'mixed',
                });
                kcUsersMock.resetPassword.mockResolvedValueOnce();
                const result: Result<string, DomainError> = await service.resetPassword(userId, generatedPassword);
                expect(result).toStrictEqual({
                    ok: true,
                    value: generatedPassword,
                });
            });
        });
        describe('when error is thrown during password-reset', () => {
            it('should pass error', async () => {
                const userId: string = faker.string.numeric();
                const generatedPassword: string = faker.string.alphanumeric({
                    length: { min: 10, max: 10 },
                    casing: 'mixed',
                });
                kcUsersMock.resetPassword.mockRejectedValueOnce(new Error());
                const result: Result<string, DomainError> = await service.resetPassword(userId, generatedPassword);
                expect(result).toStrictEqual({
                    ok: false,
                    error: new KeycloakClientError('Could not authorize with Keycloak'),
                });
            });
        });
        describe('when error thrown by getAuthedKcAdminClient', () => {
            it('should pass error', async () => {
                const userId: string = faker.string.numeric();
                const generatedPassword: string = faker.lorem.word();
                const error: Result<KeycloakAdminClient, DomainError> = {
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                };
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce(error);
                const result: Result<string, DomainError> = await service.resetPassword(userId, generatedPassword);
                expect(result).toStrictEqual({
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                });
            });
        });
    });

    describe('resetPasswordByPersonId', () => {
        describe('when user exists', () => {
            it('should return result with ok:true and new password', async () => {
                const user: UserDo<true> = DoFactory.createUser(true);
                kcUsersMock.findOne.mockResolvedValueOnce({
                    username: user.username,
                    email: user.email,
                    id: user.id,
                    createdTimestamp: user.createdDate.getTime(),
                } as unknown as UserRepresentation);
                kcUsersMock.resetPassword.mockResolvedValueOnce();
                const personId: string = faker.string.numeric();
                const result: Result<string, Error> = await service.resetPasswordByPersonId(personId);
                expect(result.ok).toBeTruthy();
                if (result.ok) {
                    expect(result.value.length == 10).toBeTruthy();
                    expect(result.value.match(/^[a-z0-9]+$/i)).toBeTruthy(); //check for isAlphanumeric
                }
                expect(kcUsersMock.resetPassword).toHaveBeenCalled();
            });
        });
        describe('when user does not exist', () => {
            it('should return result with ok: false and error', async () => {
                kcUsersMock.resetPassword.mockClear();
                const error: Result<PersonDo<true>, DomainError> = {
                    ok: false,
                    error: new EntityNotFoundError(),
                };
                personService.findPersonById.mockResolvedValueOnce(error);
                const personId: string = faker.string.numeric();
                const result: Result<string, Error> = await service.resetPasswordByPersonId(personId);
                expect(result.ok).toBeFalsy();
                expect(kcUsersMock.resetPassword).toHaveBeenCalledTimes(0);
            });
        });

        describe('when KeycloakAdminClient fails', () => {
            it('should return result with ok: false and error', async () => {
                kcUsersMock.resetPassword.mockClear();
                kcUsersMock.findOne.mockRejectedValueOnce(new Error());
                const personId: string = faker.string.numeric();
                const result: Result<string, Error> = await service.resetPasswordByPersonId(personId);
                expect(result.ok).toBeFalsy();
                expect(kcUsersMock.resetPassword).toHaveBeenCalledTimes(0);
                expect(result).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Keycloak request failed'),
                });
            });
        });

        describe('when getAuthedKcAdminClient fails', () => {
            it('should return result with ok: false and error', async () => {
                kcUsersMock.resetPassword.mockClear();
                const personDo: PersonDo<true> = DoFactory.createPerson(true, { referrer: faker.string.uuid() });
                const person: Result<PersonDo<true>, DomainError> = {
                    ok: true,
                    value: personDo,
                };
                personService.findPersonById.mockResolvedValueOnce(person);
                const adminClient: Result<KeycloakAdminClient, DomainError> = {
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                };
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce(adminClient);
                const personId: string = faker.string.numeric();
                const result: Result<string, Error> = await service.resetPasswordByPersonId(personId);
                expect(result.ok).toBeFalsy();
                expect(kcUsersMock.resetPassword).toHaveBeenCalledTimes(0);
                expect(result).toStrictEqual<Result<UserDo<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                });
            });
        });
    });
});

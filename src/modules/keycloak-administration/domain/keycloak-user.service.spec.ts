import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdminClient, UserRepresentation } from '@s3pweb/keycloak-admin-client-cjs';

import { faker } from '@faker-js/faker';
import { ConfigTestModule, DoFactory, LoggingTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { DomainError, EntityNotFoundError, KeycloakClientError } from '../../../shared/error/index.js';
import { KeycloakAdministrationService } from './keycloak-admin-client.service.js';
import { type FindUserFilter, KeycloakUserService } from './keycloak-user.service.js';
import { PersonService } from '../../person/domain/person.service.js';
import { User } from './user.js';

describe('KeycloakUserService', () => {
    let module: TestingModule;
    let service: KeycloakUserService;
    let adminService: DeepMocked<KeycloakAdministrationService>;
    let kcUsersMock: DeepMocked<KeycloakAdminClient['users']>;

    beforeAll(async () => {
        kcUsersMock = createMock<KeycloakAdminClient['users']>();

        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, LoggingTestModule],
            providers: [
                KeycloakUserService,
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
        service = module.get(KeycloakUserService);
        adminService = module.get(KeycloakAdministrationService);
    });

    beforeEach(() => {
        jest.restoreAllMocks();
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
                const user: User<true> = DoFactory.createUser(true);
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
                const user: User<true> = DoFactory.createUser(true);
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
                const user: User<true> = DoFactory.createUser(true);
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
                const user: User<false> = DoFactory.createUser(false);

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
                const user: User<false> = DoFactory.createUser(false);

                const res: Result<string> = await service.create(user);

                expect(res).toBe(error);
            });
        });
    });

    describe('createUserWithHashedPassword', () => {
        describe('when user does not exist & HashAlgo is Valid BCRYPT', () => {
            it('should return user id', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.create.mockResolvedValueOnce({ id: user.id });

                const res: Result<string> = await service.createWithHashedPassword(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    `{BCRYPT}$2b$12$hqG5T3z8v0Ou8Lmmr2mhW.lNP0DQGO9MS6PQT/CzCJP8Fcx
                    GgKOau`,
                );

                expect(res).toStrictEqual<Result<string>>({
                    ok: true,
                    value: user.id,
                });
            });
        });
        describe('when user does not exist & HashAlgo is Valid CRYPT', () => {
            it('should return user id', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.create.mockResolvedValueOnce({ id: user.id });

                const res: Result<string> = await service.createWithHashedPassword(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    `{crypt}$6$M.L8yO/PSWLRRhe6$CXj2g0wgWhiAnfROIdqJROrgbjmcmin02M1
                    sM1Z25N7H3puT6qlgsDIM.60brf1csn0Zk9GxS8sILpJvmvFi11`,
                );

                expect(res).toStrictEqual<Result<string>>({
                    ok: true,
                    value: user.id,
                });
            });
        });
        describe('when user does not exist & HashAlgo is Invalid BCRYPT', () => {
            it('should return user id', async () => {
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<string> = await service.createWithHashedPassword(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    `{BCRYPT}xxxxxhqG5T3$z8v0Ou8Lmmr2mhW.lNP0DQGO9MS6PQT/CzCJP8Fcx
                    GgKOau`,
                );

                expect(res).toEqual<Result<string>>({
                    ok: false,
                    error: new KeycloakClientError('Invalid bcrypt hash format'),
                });
            });
        });
        describe('when user does not exist & HashAlgo is Invalid crypt', () => {
            it('should return user id', async () => {
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<string> = await service.createWithHashedPassword(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    `{crypt}$$x$$M.L8yO/PSWLRRhe6$CXj2g0wgWhiAnfROIdqJROrgbjmcmin02M1
                    sM1Z25N7H3puT6qlgsDIM.60brf1csn0Zk9GxS8sILpJvmvFi11`,
                );

                expect(res).toEqual<Result<string>>({
                    ok: false,
                    error: new KeycloakClientError('Invalid crypt hash format'),
                });
            });
        });
        describe('when user does not exist & HashAlgo is not supported', () => {
            it('should return user id', async () => {
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<string> = await service.createWithHashedPassword(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    `{notsupported}$6$M.L8yO/PSWLRRhe6$CXj2g0wgWhiAnfROIdqJROrgbjmcmin02M1
                    sM1Z25N7H3puT6qlgsDIM.60brf1csn0Zk9GxS8sILpJvmvFi11`,
                );

                expect(res).toStrictEqual<Result<string>>({
                    ok: false,
                    error: new KeycloakClientError('Unsupported password algorithm'),
                });
            });
        });

        describe('when username and email already exists', () => {
            it('should return error result', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.find.mockResolvedValueOnce([
                    {
                        username: user.username,
                        email: user.email,
                        id: user.id,
                        createdTimestamp: user.createdDate.getTime(),
                    },
                ] as unknown as UserRepresentation[]);

                const res: Result<string> = await service.createWithHashedPassword(
                    {
                        id: undefined,
                        createdDate: undefined,
                        username: user.username,
                        email: user.email,
                    },
                    `{BCRYPT}$2b$12$hqG5T3z8v0Ou8Lmmr2mhW.lNP0DQGO9MS6PQT/CzCJP8Fcx
                    GgKOau`,
                );

                expect(res).toStrictEqual<Result<string>>({
                    ok: false,
                    error: new KeycloakClientError('Username or email already exists'),
                });
            });
        });

        describe('when user could not be created', () => {
            it('should return error result', async () => {
                kcUsersMock.find.mockResolvedValueOnce([
                    {
                        username: faker.string.alphanumeric(),
                        email: faker.string.alphanumeric(),
                        id: faker.string.uuid(),
                        createdTimestamp: faker.date.recent(),
                    },
                ] as unknown as UserRepresentation[]);
                const user: User<false> = DoFactory.createUser(false);
                kcUsersMock.create.mockRejectedValueOnce(new Error());

                const res: Result<string> = await service.createWithHashedPassword(
                    user,
                    `{BCRYPT}$2b$12$hqG5T3z8v0Ou8Lmmr2mhW.lNP0DQGO9MS6PQT/CzCJP8Fcx
                    GgKOau`,
                );

                expect(res).toEqual<Result<string>>({
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
                const user: User<false> = DoFactory.createUser(false);

                const res: Result<string> = await service.createWithHashedPassword(
                    user,
                    `{BCRYPT}$2b$12$hqG5T3z8v0Ou8Lmmr2mhW.lNP0DQGO9MS6PQT/CzCJP8Fcx
                    GgKOau`,
                );

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
            it('should return result with User', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.findOne.mockResolvedValueOnce({
                    username: user.username,
                    email: user.email,
                    id: user.id,
                    createdTimestamp: user.createdDate.getTime(),
                } as unknown as UserRepresentation);

                const res: Result<User<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<User<true>>>({
                    ok: true,
                    value: user,
                });
            });
        });

        describe('when user does not exist', () => {
            it('should return error result', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.findOne.mockResolvedValueOnce(undefined);

                const res: Result<User<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<User<true>>>({
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
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<User<true>> = await service.findById(user.id);

                expect(res).toBe(error);
            });
        });

        describe('when KeycloakAdminClient throws', () => {
            it('should return error result', async () => {
                kcUsersMock.findOne.mockRejectedValueOnce(new Error());
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<User<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<User<true>>>({
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
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<User<true>> = await service.findById(user.id);

                expect(res).toStrictEqual<Result<User<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Response is invalid'),
                });
            });
        });
    });

    describe('findOne', () => {
        describe('when user exists', () => {
            it('should return result with User', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.find.mockResolvedValueOnce([
                    {
                        username: user.username,
                        email: user.email,
                        id: user.id,
                        createdTimestamp: user.createdDate.getTime(),
                    },
                ] as unknown as UserRepresentation[]);

                const res: Result<User<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toStrictEqual<Result<User<true>>>({
                    ok: true,
                    value: user,
                });
            });
        });

        describe('when user does not exist', () => {
            it('should return error result', async () => {
                const user: User<true> = DoFactory.createUser(true);
                kcUsersMock.find.mockResolvedValueOnce([]);

                const res: Result<User<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toStrictEqual<Result<User<true>>>({
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
                const user: User<true> = DoFactory.createUser(true);

                const res: Result<User<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toBe(error);
            });
        });

        describe('when KeycloakAdminClient throws', () => {
            it('should return error result', async () => {
                kcUsersMock.find.mockRejectedValueOnce(new Error());
                const user: User<true> = DoFactory.createUser(true);
                const res: Result<User<true>> = await service.findOne({
                    username: user.username,
                    email: user.email,
                } as unknown as FindUserFilter);

                expect(res).toStrictEqual<Result<User<true>>>({
                    ok: false,
                    error: new KeycloakClientError('Keycloak request failed'),
                });
            });
        });
    });

    describe('setPassword', () => {
        describe('will be executed successfully', () => {
            describe('if password is temporary', () => {
                it('should return result with ok:true and new temporary password', async () => {
                    const userId: string = faker.string.numeric();
                    const generatedPassword: string = faker.string.alphanumeric({
                        length: { min: 10, max: 10 },
                        casing: 'mixed',
                    });
                    kcUsersMock.resetPassword.mockResolvedValueOnce();

                    const result: Result<string, DomainError> = await service.setPassword(userId, generatedPassword);

                    expect(result).toStrictEqual({
                        ok: true,
                        value: generatedPassword,
                    });
                    expect(kcUsersMock.resetPassword).toHaveBeenCalledWith({
                        id: userId,
                        credential: {
                            temporary: true,
                            type: 'password',
                            value: generatedPassword,
                        },
                    });
                });
            });
            describe('if password is permanent', () => {
                it('should return result with ok:true and new permanent password', async () => {
                    const userId: string = faker.string.numeric();
                    const generatedPassword: string = faker.string.alphanumeric({
                        length: { min: 10, max: 10 },
                        casing: 'mixed',
                    });
                    kcUsersMock.resetPassword.mockResolvedValueOnce();

                    const result: Result<string, DomainError> = await service.setPassword(
                        userId,
                        generatedPassword,
                        false,
                    );

                    expect(result).toStrictEqual({
                        ok: true,
                        value: generatedPassword,
                    });
                    expect(kcUsersMock.resetPassword).toHaveBeenCalledWith({
                        id: userId,
                        credential: {
                            temporary: false,
                            type: 'password',
                            value: generatedPassword,
                        },
                    });
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
                const result: Result<string, DomainError> = await service.setPassword(userId, generatedPassword);
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
                const result: Result<string, DomainError> = await service.setPassword(userId, generatedPassword);
                expect(result).toStrictEqual({
                    ok: false,
                    error: new KeycloakClientError('Could not authenticate'),
                });
            });
        });
    });
});

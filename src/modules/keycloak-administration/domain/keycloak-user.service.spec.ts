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

describe('KeycloakUserService', () => {
    let module: TestingModule;
    let service: KeycloakUserService;
    let adminService: DeepMocked<KeycloakAdministrationService>;
    let kcUsersMock: DeepMocked<KeycloakAdminClient['users']>;
    let kcGroupsMock: DeepMocked<KeycloakAdminClient['groups']>;
    let kcRolesMock: DeepMocked<KeycloakAdminClient['roles']>;

    beforeAll(async () => {
        kcUsersMock = createMock<KeycloakAdminClient['users']>();
        kcGroupsMock = createMock<KeycloakAdminClient['groups']>();
        kcRolesMock = createMock<KeycloakAdminClient['roles']>();

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
                                    groups: kcGroupsMock,
                                    roles: kcRolesMock,
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
    describe('createGroup', () => {
        const groupName: string = faker.internet.userName();
        const groupId: string = faker.string.numeric();

        describe('when KeycloakAdminClient cannot be obtained', () => {
            it('should return an error result', async () => {
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Authentication failed'),
                });

                const result: Result<string, DomainError> = await service.createGroup(groupName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Authentication failed'),
                });
            });
        });

        describe('when group already exists', () => {
            it('should return an error result', async () => {
                kcGroupsMock.find.mockResolvedValueOnce([{ name: groupName }]);

                const result: Result<string, DomainError> = await service.createGroup(groupName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Group name already exists'),
                });
            });
        });

        describe('when group is successfully created', () => {
            it('should return the id of the created group', async () => {
                kcGroupsMock.find.mockResolvedValueOnce([]);
                kcGroupsMock.create.mockResolvedValueOnce({ id: groupId });

                const result: Result<string, DomainError> = await service.createGroup(groupName);

                expect(result).toEqual({
                    ok: true,
                    value: groupId,
                });
            });
        });

        describe('when an error occurs during group creation', () => {
            it('should return an error result', async () => {
                kcGroupsMock.find.mockResolvedValueOnce([]);
                kcGroupsMock.create.mockRejectedValueOnce(new Error('Creation failed'));

                const result: Result<string, DomainError> = await service.createGroup(groupName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Could not create group'),
                });
            });
        });
    });
    describe('createRole', () => {
        const roleName: string = faker.internet.userName();

        describe('when KeycloakAdminClient cannot be obtained', () => {
            it('should return an error result', async () => {
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Authentication failed'),
                });

                const result: Result<string, DomainError> = await service.createRole(roleName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Authentication failed'),
                });
            });
        });

        describe('when role already exists', () => {
            it('should return an error result', async () => {
                kcRolesMock.findOneByName.mockResolvedValueOnce({ name: roleName });

                const result: Result<string, DomainError> = await service.createRole(roleName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Role name already exists'),
                });
            });
        });

        describe('when role is successfully created', () => {
            it('should return the name of the created role', async () => {
                kcRolesMock.findOneByName.mockResolvedValueOnce(undefined);
                kcRolesMock.create.mockResolvedValueOnce({ roleName });

                const result: Result<string, DomainError> = await service.createRole(roleName);

                expect(result).toEqual({
                    ok: true,
                    value: roleName,
                });
            });
        });

        describe('when an error occurs during role creation', () => {
            it('should return an error result', async () => {
                kcRolesMock.findOneByName.mockResolvedValueOnce(undefined);
                kcRolesMock.create.mockRejectedValueOnce(new Error('Creation failed'));

                const result: Result<string, DomainError> = await service.createRole(roleName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Could not create role'),
                });
            });
        });
    });
    describe('addRoleToGroup', () => {
        const groupId: string = faker.string.uuid();
        const roleName: string = faker.internet.userName();

        describe('when KeycloakAdminClient cannot be obtained', () => {
            it('should return an error result', async () => {
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Authentication failed'),
                });

                const result: Result<boolean, DomainError> = await service.addRoleToGroup(groupId, roleName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Authentication failed'),
                });
            });
        });

        describe('when role does not exist or id/name is undefined', () => {
            it('should return an error result', async () => {
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce({
                    ok: true,
                    value: createMock<KeycloakAdminClient>({
                        roles: {
                            findOneByName: jest.fn().mockResolvedValueOnce(undefined),
                        },
                    }),
                });

                const result: Result<boolean, DomainError> = await service.addRoleToGroup(groupId, roleName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Role not found or id/name is undefined'),
                });
            });
        });

        describe('when role is successfully added to group', () => {
            it('should return true', async () => {
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce({
                    ok: true,
                    value: createMock<KeycloakAdminClient>({
                        roles: {
                            findOneByName: jest.fn().mockResolvedValueOnce({ id: faker.string.uuid(), name: roleName }),
                        },
                        groups: {
                            addRealmRoleMappings: jest.fn().mockResolvedValueOnce(undefined),
                        },
                    }),
                });

                const result: Result<boolean, DomainError> = await service.addRoleToGroup(groupId, roleName);

                expect(result).toEqual({
                    ok: true,
                    value: true,
                });
            });
        });

        describe('when an error occurs during adding role to group', () => {
            it('should return an error result', async () => {
                adminService.getAuthedKcAdminClient.mockResolvedValueOnce({
                    ok: true,
                    value: createMock<KeycloakAdminClient>({
                        roles: {
                            findOneByName: jest.fn().mockResolvedValueOnce({ id: faker.string.uuid(), name: roleName }),
                        },
                        groups: {
                            addRealmRoleMappings: jest
                                .fn()
                                .mockRejectedValueOnce(new Error('Add role to group failed')),
                        },
                    }),
                });

                const result: Result<boolean, DomainError> = await service.addRoleToGroup(groupId, roleName);

                expect(result).toEqual({
                    ok: false,
                    error: new KeycloakClientError('Could not add role to group'),
                });
            });
        });
    });
});

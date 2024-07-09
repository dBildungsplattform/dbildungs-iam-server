import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';

import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { DomainError, KeycloakClientError } from '../../../shared/error/index.js';
import { PersonService } from '../../person/domain/person.service.js';
import { KeycloakAdministrationService } from './keycloak-admin-client.service.js';
import { KeycloakGroupRoleService } from './keycloak-group-role.service.js';

describe('KeycloakGroupRoleService', () => {
    let module: TestingModule;
    let service: KeycloakGroupRoleService;
    let adminService: DeepMocked<KeycloakAdministrationService>;
    let kcGroupsMock: DeepMocked<KeycloakAdminClient['groups']>;
    let kcRolesMock: DeepMocked<KeycloakAdminClient['roles']>;

    beforeAll(async () => {
        kcGroupsMock = createMock<KeycloakAdminClient['groups']>();
        kcRolesMock = createMock<KeycloakAdminClient['roles']>();

        module = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule],
            providers: [
                KeycloakGroupRoleService,
                {
                    provide: KeycloakAdministrationService,
                    useValue: createMock<KeycloakAdministrationService>({
                        getAuthedKcAdminClient() {
                            return Promise.resolve({
                                ok: true,
                                value: createMock<KeycloakAdminClient>({
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
        service = module.get(KeycloakGroupRoleService);
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

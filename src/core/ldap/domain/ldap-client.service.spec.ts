import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LdapTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { LdapConfigModule } from '../ldap-config.module.js';
import { LdapModule } from '../ldap.module.js';
import { faker } from '@faker-js/faker';
import { LdapClientService, LdapPersonAttributes, PersonData } from './ldap-client.service.js';
import { Person } from '../../../modules/person/domain/person.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClient } from './ldap-client.js';
import { Attribute, Change, Client, Entry, SearchResult } from 'ldapts';
import { PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { LdapSearchError } from '../error/ldap-search.error.js';
import { LdapEntityType } from './ldap.types.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { EventService } from '../../eventbus/services/event.service.js';
import { LdapEmailDomainError } from '../error/ldap-email-domain.error.js';
import { LdapEmailAddressError } from '../error/ldap-email-address.error.js';
import { LdapCreateLehrerError } from '../error/ldap-create-lehrer.error.js';
import { LdapModifyEmailError } from '../error/ldap-modify-email.error.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import { LdapAddPersonToGroupError } from '../error/ldap-add-person-to-group.error.js';
import { LdapRemovePersonFromGroupError } from '../error/ldap-remove-person-from-group.error.js';
import { LdapModifyUserPasswordError } from '../error/ldap-modify-user-password.error.js';
import assert from 'assert';

describe('LDAP Client Service', () => {
    let app: INestApplication;
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let ldapClientService: LdapClientService;
    let ldapClientMock: DeepMocked<LdapClient>;
    let loggerMock: DeepMocked<ClassLogger>;
    let eventServiceMock: DeepMocked<EventService>;
    let clientMock: DeepMocked<Client>;
    let instanceConfig: LdapInstanceConfig;

    let person: Person<true>;
    const mockLdapInstanceConfig: LdapInstanceConfig = {
        BASE_DN: 'dc=example,dc=com',
        OEFFENTLICHE_SCHULEN_DOMAIN: 'schule-sh.de',
        ERSATZSCHULEN_DOMAIN: 'ersatzschule-sh.de',
        RETRY_WRAPPER_DEFAULT_RETRIES: 2,
        URL: '',
        BIND_DN: '',
        ADMIN_PASSWORD: '',
    };

    /**
     * Returns an Entry-object for a person. Undefined values will not be filled with any default values.
     */
    function getPersonEntry(
        dn: string,
        givenName?: string,
        sn?: string,
        cn?: string,
        mailPrimaryAddress?: string,
        mailAlternativeAddress?: string,
    ): Entry {
        return createMock<Entry>({
            dn: dn,
            givenName: givenName,
            sn: sn,
            cn: cn,
            mailPrimaryAddress: mailPrimaryAddress,
            mailAlternativeAddress: mailAlternativeAddress,
        });
    }

    /**
     * Returns a PersonData-object, id, vorname, familienname, username, ldapEntryUUID will be filled with faker-values when not defined.
     * The ldapEntryUUID has no default!
     */
    function getPersonData(
        id?: string,
        vorname?: string,
        familienname?: string,
        username?: string,
        ldapEntryUUID?: string,
    ): PersonData {
        return {
            id: id ?? faker.string.uuid(),
            vorname: vorname ?? faker.person.firstName(),
            familienname: familienname ?? faker.person.lastName(),
            username: username ?? faker.internet.userName(),
            ldapEntryUUID: ldapEntryUUID ?? faker.string.uuid(),
        };
    }

    function makeMockClient(cb: (client: DeepMocked<Client>) => void): void {
        ldapClientMock.getClient.mockImplementationOnce(() => {
            const client: DeepMocked<Client> = createMock<Client>();

            cb(client);

            return client;
        });
    }

    function mockBind(error?: unknown): void {
        makeMockClient((client: DeepMocked<Client>) => {
            if (error) {
                client.bind.mockRejectedValueOnce(error);
            } else {
                client.bind.mockResolvedValueOnce();
            }
        });
    }

    function mockAddPersonToGroup(): void {
        makeMockClient((client: DeepMocked<Client>) => {
            mockBind();

            // Organisation Unit check
            client.search.mockResolvedValueOnce(
                createMock<SearchResult>({
                    searchEntries: [{}],
                }),
            );

            // Organisation Role check
            client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [{}] }));

            // Group of Names check
            client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [{}] }));

            // Add user to group
            client.modify.mockResolvedValueOnce();
        });
    }

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LdapModule,
                MapperTestModule,
                LdapConfigModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: LdapInstanceConfig,
                    useValue: mockLdapInstanceConfig,
                },
            ],
        })
            .overrideModule(LdapConfigModule)
            .useModule(LdapTestModule.forRoot({ isLdapRequired: true }))
            .overrideProvider(LdapClient)
            .useValue(createMock<LdapClient>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EventService)
            .useValue(createMock<EventService>())
            .overrideProvider(LdapInstanceConfig)
            .useValue(mockLdapInstanceConfig)
            .compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        ldapClientService = module.get(LdapClientService);
        ldapClientMock = module.get(LdapClient);
        loggerMock = module.get(ClassLogger);
        eventServiceMock = module.get(EventService);
        clientMock = createMock<Client>();
        instanceConfig = module.get(LdapInstanceConfig);

        person = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            undefined,
            faker.internet.userName(),
        );

        //currently only used to wait for the LDAP container, because setupDatabase() is blocking
        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        await orm.close();
        await app.close();
        jest.clearAllTimers();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        jest.spyOn(ldapClientService as any, 'executeWithRetry').mockImplementation((...args: unknown[]) => {
            //Needed To globally mock the private executeWithRetry function (otherwise test run too long)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const func: () => Promise<Result<any>> = args[0] as () => Promise<Result<any>>;
            return func();
        });
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });
    describe('updateMemberDnInGroups', () => {
        const fakeOldUsername: PersonReferrer = 'old-user';
        const fakeNewUsername: PersonReferrer = 'new-user';
        const fakeOldUID: string = `uid=${fakeOldUsername},ou=users,${mockLdapInstanceConfig.BASE_DN}`;
        const fakeNewUID: string = `uid=${fakeNewUsername},ou=users,${mockLdapInstanceConfig.BASE_DN}`;
        const fakeGroupDn: string = 'cn=lehrer-group,' + mockLdapInstanceConfig.BASE_DN;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should update member DN in all groups successfully', async () => {
            const clientMock2: Client = {
                search: jest.fn().mockResolvedValueOnce({
                    searchEntries: [
                        {
                            dn: fakeGroupDn,
                            member: [fakeOldUID, 'uid=other-user,ou=users,' + mockLdapInstanceConfig.BASE_DN],
                        },
                    ],
                    searchReferences: [],
                }),
                modify: jest.fn().mockResolvedValueOnce({}),
            } as unknown as Client;

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock2,
            );

            assert(result.ok);
            expect(result.value).toBe(`Updated member data for 1 groups.`);
            expect(clientMock2.modify).toHaveBeenCalledTimes(1);
            expect(clientMock2.modify).toHaveBeenNthCalledWith(1, fakeGroupDn, [
                new Change({
                    operation: 'replace',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeNewUID, 'uid=other-user,ou=users,' + mockLdapInstanceConfig.BASE_DN],
                    }),
                }),
            ]);
            expect(loggerMock.info).toHaveBeenCalledWith(`LDAP: Updated member data for group: ${fakeGroupDn}`);
        });

        it('should return a message when no groups are found', async () => {
            const clientMock3: Client = {
                search: jest.fn().mockResolvedValueOnce({
                    searchEntries: [],
                    searchReferences: [],
                }),
                modify: jest.fn().mockResolvedValueOnce({}),
            } as unknown as Client;

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock3,
            );

            assert(result.ok);
            expect(result.value).toBe(`No groups found for person:${fakeOldUsername}`);
            expect(loggerMock.info).toHaveBeenCalledWith(`LDAP: No groups found for person:${fakeOldUsername}`);
        });

        it('should handle errors when updating group membership fails', async () => {
            const clientMock5: Client = {
                search: jest.fn().mockResolvedValueOnce({
                    searchEntries: [
                        {
                            dn: fakeGroupDn,
                            member: [fakeOldUID],
                        },
                    ],
                    searchReferences: [],
                }),
                modify: jest.fn().mockRejectedValueOnce(new Error('Modify error')),
            } as unknown as Client;

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock5,
            );

            expect(result.ok).toBeTruthy();
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LDAP: Error while updating member data for group: ${fakeGroupDn}, errMsg: ${String(new Error('Modify error'))}`,
            );
        });

        it('should handle groups with empty or undefined member lists', async () => {
            const clientMock4: Client = {
                search: jest.fn().mockResolvedValueOnce({
                    searchEntries: undefined,
                    searchReferences: [],
                }),
                modify: jest.fn().mockResolvedValueOnce({}),
            } as unknown as Client;

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock4,
            );

            assert(!result.ok);
            expect(result.error.message).toBe(`LDAP: Error while searching for groups for person: ${fakeOldUsername}`);
            expect(clientMock.modify).not.toHaveBeenCalled();
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LDAP: Error while searching for groups for person: ${fakeOldUsername}`,
            );
        });

        it('should handle member as Buffer correctly', async () => {
            const bufferMember: Buffer = Buffer.from(fakeOldUID);
            clientMock.search.mockResolvedValueOnce({
                searchEntries: [
                    {
                        dn: fakeGroupDn,
                        member: bufferMember,
                    },
                ],
                searchReferences: [],
            });
            clientMock.modify.mockResolvedValueOnce();

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock,
            );

            assert(result.ok);
            expect(result.value).toBe(`Updated member data for 1 groups.`);
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'replace',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeNewUID],
                    }),
                }),
            ]);
        });

        it('should handle member as a single string correctly', async () => {
            clientMock.search.mockResolvedValueOnce({
                searchEntries: [
                    {
                        dn: fakeGroupDn,
                        member: fakeOldUID,
                    },
                ],
                searchReferences: [],
            });
            clientMock.modify.mockResolvedValueOnce();

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock,
            );

            assert(result.ok);
            expect(result.value).toBe(`Updated member data for 1 groups.`);
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'replace',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeNewUID],
                    }),
                }),
            ]);
        });

        it('should handle member as an array of Buffers correctly', async () => {
            const bufferMembers: Buffer[] = [
                Buffer.from(fakeOldUID),
                Buffer.from('uid=other-user,ou=users,' + mockLdapInstanceConfig.BASE_DN),
            ];
            clientMock.search.mockResolvedValueOnce({
                searchEntries: [
                    {
                        dn: fakeGroupDn,
                        member: bufferMembers,
                    },
                ],
                searchReferences: [],
            });
            clientMock.modify.mockResolvedValueOnce();

            const result: Result<string, Error> = await ldapClientService.updateMemberDnInGroups(
                fakeOldUsername,
                fakeNewUsername,
                fakeOldUID,
                clientMock,
            );

            assert(result.ok);
            expect(result.value).toBe(`Updated member data for 1 groups.`);
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'replace',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeNewUID, 'uid=other-user,ou=users,' + mockLdapInstanceConfig.BASE_DN],
                    }),
                }),
            ]);
        });
    });

    describe('getRootName', () => {
        it('when emailDomain is neither schule-sh.de nor ersatzschule-sh.de should return LdapEmailDomainError', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting('user123', 'wrong-domain.de');

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(LdapEmailDomainError);
        });

        it('when emailDomain is one that is explicitly set in config but neither schule-sh.de nor ersatzschule-sh.de it should go through', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                return clientMock;
            });

            instanceConfig.OEFFENTLICHE_SCHULEN_DOMAIN = 'weird-domain.ina.foreign.country.co.uk';
            instanceConfig.ERSATZSCHULEN_DOMAIN = 'normaldomain.co.jp';

            const resultOeffentlich: Result<boolean> = await ldapClientService.isLehrerExisting(
                'user123',
                'weird-domain.ina.foreign.country.co.uk',
            );

            const resultErsatz: Result<boolean> = await ldapClientService.isLehrerExisting(
                'user123',
                'normaldomain.co.jp',
            );
            const resultOldDefault: Result<boolean> = await ldapClientService.isLehrerExisting(
                'user123',
                'schule-sh.de',
            );

            instanceConfig.OEFFENTLICHE_SCHULEN_DOMAIN = undefined;
            instanceConfig.ERSATZSCHULEN_DOMAIN = undefined;

            expect(resultOeffentlich.ok).toBeTruthy();
            expect(resultErsatz.ok).toBeTruthy();
            expect(resultOldDefault.ok).toBeTruthy();
        });
    });

    describe('isLehrerExisting', () => {
        const fakeEmailDomain: string = 'schule-sh.de';
        it('when lehrer exists should return true', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }),
                );
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting('user123', fakeEmailDomain);

            expect(result.ok).toBeTruthy();
            if (result.ok) {
                expect(result.value).toBeTruthy();
            }
        });
        it('when lehrer does not exists should return false', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting('user123', fakeEmailDomain);

            expect(result.ok).toBeTruthy();
            if (result.ok) {
                expect(result.value).toBeFalsy();
            }
        });
        it('when bind returns error', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockRejectedValueOnce(new Error());
                clientMock.add.mockResolvedValueOnce();
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting('user123', fakeEmailDomain);

            expect(result.ok).toBeFalsy();
        });
        it('when called with invalid emailDomain returns LdapEmailDomainError', async () => {
            const result: Result<boolean> = await ldapClientService.isLehrerExisting(
                'user123',
                'wrong-email-domain.de',
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(LdapEmailDomainError);
        });
    });

    describe('addPersonToGroup', () => {
        const fakeUsername: PersonReferrer = 'test-user';
        const fakeSchuleDstNr: string = '123';
        const fakeLehrerUid: string = `uid=${fakeUsername},ou=oeffentlicheSchulen,${mockLdapInstanceConfig.BASE_DN}`;
        const fakeGroupId: string = `lehrer-${fakeSchuleDstNr}`;
        const fakeGroupDn: string = `cn=${fakeGroupId},cn=groups,ou=${fakeSchuleDstNr},${mockLdapInstanceConfig.BASE_DN}`;

        it('should successfully add a person to an existing group', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalUnit
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalRole
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>({ dn: fakeGroupDn })] }), // Search for groupOfNames
                    );
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'add',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeLehrerUid],
                    }),
                }),
            ]);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully added person ${fakeUsername} to group ${fakeGroupId}`,
            );
        });

        it('should create a new organizationalUnit and add the person if the organizationalUnit does not exist', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [] }), // No organizationalUnit found
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalRole
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for groupOfNames
                    );
                clientMock.add.mockResolvedValueOnce(); // Add organizationalUnit
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.add).toHaveBeenCalledWith(
                `ou=${fakeSchuleDstNr},${mockLdapInstanceConfig.BASE_DN}`,
                expect.objectContaining({ ou: fakeSchuleDstNr, objectClass: 'organizationalUnit' }),
            );
        });

        it('should create a new group and add the person if the group does not exist', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalUnit
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalRole
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [] }), // No groupOfNames found
                    );
                clientMock.add.mockResolvedValueOnce(); // Add group
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.add).toHaveBeenCalledWith(fakeGroupDn, {
                cn: fakeGroupId,
                objectclass: ['groupOfNames'],
                member: [fakeLehrerUid],
            });
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully created group ${fakeGroupId} and added person ${fakeUsername}`,
            );
        });

        it('should return error if group creation fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalUnit
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalRole
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [] }), // No groupOfNames found
                    );
                clientMock.add.mockRejectedValueOnce(new Error('Group creation failed'));

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(LdapAddPersonToGroupError);
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LDAP: Failed to create group ${fakeGroupId}, errMsg: Error: Group creation failed`,
            );
        });

        it('should return error if person addition to the group fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalUnit
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Search for organizationalRole
                    )
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }), // Group found
                    );
                clientMock.modify.mockRejectedValueOnce(new Error('Modify error'));

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(LdapAddPersonToGroupError);
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LDAP: Failed to add person to group ${fakeGroupId}, errMsg: Error: Modify error`,
            );
        });

        it('should return error if bind fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockRejectedValueOnce(new Error());
                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(Error);
        });

        it('should return false if person is already in the group', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search
                    .mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }))
                    .mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }))
                    .mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    dn: fakeGroupDn,
                                    member: [fakeLehrerUid],
                                }),
                            ],
                        }),
                    );

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.addPersonToGroup(
                fakeUsername,
                fakeSchuleDstNr,
                fakeLehrerUid,
            );

            assert(result.ok);
            expect(result.value).toBe(false);
            expect(clientMock.modify).not.toHaveBeenCalled();
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Person ${fakeUsername} is already in group ${fakeGroupId}`,
            );
        });
    });

    describe('removeMailAlternativeAddress', () => {
        const personId: PersonID = faker.string.uuid();
        const username: PersonReferrer = faker.internet.userName();

        describe('when emailAddress CANNOT be splitted at @', () => {
            it('should return error', async () => {
                const address: string = 'vorname.nachname';
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailAddressError);
            });
        });

        describe('when getting root-name fails', () => {
            it('should return error', async () => {
                const domain: string = 'not-a-valid-domain.de';
                const address: string = 'vorname.nachname@' + domain;
                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not get root-name because email-domain is invalid, domain:${domain}`,
                );
            });
        });

        describe('when bind fails', () => {
            it('should return error', async () => {
                const address: string = 'vorname.nachname@schule-sh.de';
                const bindError: Error = new Error('LDAP bind FAILED');
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind(bindError);

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(Error);
            });
        });

        describe('when PersonEntry CANNOT be fetched by uid', () => {
            it('should return error', async () => {
                const address: string = 'vorname.nachname@schule-sh.de';
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapSearchError);
            });
        });

        describe('when fetching PersonEntry succeeds but fetching mailAlternativeAddress fails', () => {
            it('should return error', async () => {
                const entry: Entry = getPersonEntry('uid=user,ou=oeffentlicheSchulen,dc=schule-sh,dc=de');
                const address: string = 'vorname.nachname@schule-sh.de';
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [entry] }));
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapModifyEmailError);
            });
        });

        describe('when mailAlternativeAddress of PersonEntry does NOT match address', () => {
            it('should log info error and return without modification', async () => {
                const mailAlternativeAddress: string = faker.internet.email();
                const address: string = 'vorname.nachname@schule-sh.de';
                const entry: Entry = getPersonEntry(
                    'uid=user,ou=oeffentlicheSchulen,dc=schule-sh,dc=de',
                    faker.person.firstName(),
                    faker.person.lastName(),
                    username,
                    faker.internet.email(),
                    mailAlternativeAddress,
                );
                const modifyError: Error = new Error();

                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [entry] }));
                    client.modify.mockRejectedValueOnce(modifyError);
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(result.ok);
                expect(result.value).toBeFalsy();
                expect(clientMock.modify).toHaveBeenCalledTimes(0);
            });
        });

        describe('when modifying PersonEntry with changed mailAlternativeAddress fails', () => {
            it('should log unknown error and return error', async () => {
                const address: string = 'vorname.nachname@schule-sh.de';
                const entry: Entry = getPersonEntry(
                    'uid=user,ou=oeffentlicheSchulen,dc=schule-sh,dc=de',
                    faker.person.firstName(),
                    faker.person.lastName(),
                    username,
                    faker.internet.email(),
                    address,
                );
                const modifyError: Error = new Error();

                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [entry] }));
                    client.modify.mockRejectedValueOnce(modifyError);
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapModifyEmailError);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `LDAP: Deletion of mailAlternativeAddress FAILED`,
                    modifyError,
                );
            });
        });

        describe('when modifying PersonEntry with changed mailAlternativeAddress succeeds', () => {
            it('should log info and publish LdapPersonEntryChangedEvent', async () => {
                const address: string = 'vorname.nachname@schule-sh.de';
                const entry: Entry = getPersonEntry(
                    'uid=user,ou=oeffentlicheSchulen,dc=schule-sh,dc=de',
                    faker.person.firstName(),
                    faker.person.lastName(),
                    username,
                    faker.internet.email(),
                    address,
                );

                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [entry] }));
                    client.modify.mockResolvedValueOnce();
                });

                const result: Result<boolean> = await ldapClientService.removeMailAlternativeAddress(
                    personId,
                    username,
                    address,
                );

                assert(result.ok);
                expect(result.value).toBeTruthy();
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `LDAP: Successfully deleted mailPrimaryAddress:${address} for personId:${personId}, username:${username}`,
                );
            });
        });
    });

    describe('executeWithRetry', () => {
        beforeEach(() => {
            jest.restoreAllMocks(); //Needed To Reset the global executeWithRetry Mock
        });

        it('when operation succeeds should return value', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockResolvedValue({ searchEntries: [] } as unknown as SearchResult);

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting(
                faker.lorem.word(),
                'schule-sh.de',
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.bind).toHaveBeenCalledTimes(1);
            expect(loggerMock.warning).not.toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed'));
        });

        it('when operation fails it should automatically retry the operation with nr of fallback retries', async () => {
            instanceConfig.RETRY_WRAPPER_DEFAULT_RETRIES = undefined;
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockRejectedValue(new Error());

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting(
                faker.lorem.word(),
                'schule-sh.de',
            );

            expect(result.ok).toBeFalsy();
            expect(clientMock.bind).toHaveBeenCalledTimes(3);
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed'));
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 2 failed'));
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 3 failed'));
            instanceConfig.RETRY_WRAPPER_DEFAULT_RETRIES = 2;
        });

        it('when operation fails and throws Error it should automatically retry the operation with nr of retries set via env', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockRejectedValue(new Error());

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting(
                faker.lorem.word(),
                'schule-sh.de',
            );

            expect(result.ok).toBeFalsy();
            expect(clientMock.bind).toHaveBeenCalledTimes(2);
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed'));
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 2 failed'));
        });

        it('when operation fails and returns Error it should automatically retry the operation  with nr of retries set via env', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockResolvedValue({} as SearchResult);
                return clientMock;
            });
            const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                faker.string.uuid(),
                faker.internet.userName(),
                faker.internet.email(),
            );

            expect(result.ok).toBeFalsy();
            expect(clientMock.bind).toHaveBeenCalledTimes(0);
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed'));
            expect(loggerMock.warning).toHaveBeenCalledWith(expect.stringContaining('Attempt 2 failed'));
        });
    });

    describe('creation', () => {
        const fakeEmailDomain: string = 'schule-sh.de';
        const fakeOrgaKennung: string = '123';

        describe('lehrer', () => {
            it('when called with extra entryUUID should return truthy result', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();
                    mockAddPersonToGroup();

                    // exists check
                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));

                    // Add
                    client.add.mockResolvedValueOnce();

                    // Get EntryUUID
                    client.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    entryUUID: faker.string.uuid(),
                                }),
                            ],
                        }),
                    );
                });

                const testLehrer: PersonData = getPersonData();
                const lehrerUid: string =
                    'uid=' + testLehrer.username + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Successfully created lehrer ${lehrerUid}`);
            });

            it('when called WITHOUT entryUUID should use person.id and return truthy result', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();
                    mockAddPersonToGroup();

                    // exists check
                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));

                    // Add
                    client.add.mockResolvedValueOnce();

                    // Get EntryUUID
                    client.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    entryUUID: faker.string.uuid(),
                                }),
                            ],
                        }),
                    );
                });

                const testLehrer: PersonData = getPersonData();
                const lehrerUid: string =
                    'uid=' + testLehrer.username + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Successfully created lehrer ${lehrerUid}`);
            });

            it('when adding fails should log error', async () => {
                const error: Error = new Error('LDAP-Error');
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.bind.mockResolvedValue();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>());
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.add.mockRejectedValueOnce(error);

                    return clientMock;
                });
                const testLehrer: PersonData = getPersonData();
                const lehrerUid: string =
                    'uid=' + testLehrer.username + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                assert(!result.ok);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `LDAP: Creating lehrer FAILED, uid:${lehrerUid}`,
                    error,
                );
                expect(result.error).toEqual(new LdapCreateLehrerError());
            });

            it('when called with explicit domain "ersatzschule-sh.de" should return truthy result', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();
                    mockAddPersonToGroup();

                    // exists check
                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));

                    // Add
                    client.add.mockResolvedValueOnce();

                    // Get EntryUUID
                    client.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    entryUUID: faker.string.uuid(),
                                }),
                            ],
                        }),
                    );
                });

                const testLehrer: PersonData = getPersonData();
                const fakeErsatzSchuleAddressDomain: string = 'ersatzschule-sh.de';
                const lehrerUid: string =
                    'uid=' + testLehrer.username + ',ou=ersatzSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeErsatzSchuleAddressDomain,
                    fakeOrgaKennung,
                    undefined,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Successfully created lehrer ${lehrerUid}`);
            });

            it('when lehrer already exists', async () => {
                const personData: PersonData = getPersonData();
                const lehrerUid: string =
                    'uid=' + personData.username + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    dn: lehrerUid,
                                }),
                            ],
                        }),
                    ); //mock: lehrer already exists

                    return clientMock;
                });
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    personData,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Lehrer ${lehrerUid} exists, nothing to create`);
                expect(result.ok).toBeTruthy();
            });

            it('when called with person without username should return error result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] })); //mock: lehrer not present

                    return clientMock;
                });
                const personData: PersonData = getPersonData();
                personData.username = undefined;
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    personData,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeFalsy();
            });

            it('when bind returns error', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    clientMock.add.mockResolvedValueOnce();
                    return clientMock;
                });
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    person,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeFalsy();
            });

            it('when entryUUID can not be retrieved after add', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();
                    mockAddPersonToGroup();

                    // exists check
                    client.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));

                    // Add
                    client.add.mockResolvedValueOnce();

                    // Get EntryUUID
                    client.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [createMock<Entry>({})],
                        }),
                    );
                });

                const testLehrer: PersonData = getPersonData();
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeFalsy();
                expect(loggerMock.error).toHaveBeenLastCalledWith(
                    `Could not get EntryUUID for username:${testLehrer.username}, personId:${testLehrer.id}`,
                );
            });

            it('when called with invalid emailDomain returns LdapEmailDomainError', async () => {
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    person,
                    'wrong-email-domain.de',
                    fakeOrgaKennung,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });

            it('should log an error and return the failed result if addPersonToGroup fails', async () => {
                const username: PersonReferrer = 'test-user';
                const schulId: string = '123';
                const expectedGroupId: string = `lehrer-${schulId}`;
                const errorMessage: string = `LDAP: Failed to add lehrer ${username} to group ${expectedGroupId}`;

                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.add.mockRejectedValueOnce(new Error('Group addition failed'));
                    return clientMock;
                });

                jest.spyOn(ldapClientService, 'addPersonToGroup').mockResolvedValue({
                    ok: false,
                    error: new Error('Group addition failed'),
                });

                const result: Result<PersonData, Error> = await ldapClientService.createLehrer(
                    {
                        id: faker.string.uuid(),
                        vorname: faker.person.firstName(),
                        familienname: faker.person.lastName(),
                        username: username,
                    },
                    'schule-sh.de',
                    schulId,
                );

                assert(!result.ok);
                expect(loggerMock.error).toHaveBeenCalledWith(errorMessage);
                expect(result.error.message).toContain('Group addition failed');
            });
        });
    });

    describe('deletion', () => {
        const fakeEmailDomain: string = 'schule-sh.de';
        const fakeOrgaKennung: string = '123';
        describe('delete lehrer', () => {
            it('should return truthy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.del.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>());
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [createMock<Entry>()],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    person,
                    fakeOrgaKennung,
                    fakeEmailDomain,
                );

                expect(result.ok).toBeTruthy();
            });

            it('should return truthy result, when person to delete is not found', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.del.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>());
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    person,
                    fakeOrgaKennung,
                    fakeEmailDomain,
                );

                expect(result.ok).toBeTruthy();
            });

            it('should return error when deletion fails', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.del.mockRejectedValueOnce(new Error());
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>());
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [createMock<Entry>()],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    person,
                    fakeOrgaKennung,
                    fakeEmailDomain,
                );

                expect(result.ok).toBeFalsy();
            });

            it('when called with person without username should return error result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.add.mockResolvedValueOnce();

                    return clientMock;
                });
                const personData: PersonData = getPersonData();
                personData.username = undefined;
                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    personData,
                    fakeOrgaKennung,
                    fakeEmailDomain,
                );

                expect(result.ok).toBeFalsy();
            });

            it('when bind returns error', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    clientMock.add.mockResolvedValueOnce();

                    return clientMock;
                });
                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    person,
                    fakeOrgaKennung,
                    fakeEmailDomain,
                );

                expect(result.ok).toBeFalsy();
            });

            it('when called with invalid emailDomain returns LdapEmailDomainError', async () => {
                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    person,
                    fakeOrgaKennung,
                    'wrong-email-domain.de',
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });
        });

        describe('deleteLehrerByUsername', () => {
            it('should return truthy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [createMock<Entry>()],
                        }),
                    );
                    clientMock.del.mockResolvedValueOnce();

                    return clientMock;
                });

                const result: Result<PersonID> = await ldapClientService.deleteLehrerByUsername(person.referrer!);

                expect(result.ok).toBeTruthy();
            });

            it('should return error when lehrer cannot be found', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    clientMock.del.mockResolvedValueOnce();

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.deleteLehrerByUsername(person.referrer!);

                expect(result.ok).toBeFalsy();
            });

            it('when bind returns error', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    clientMock.add.mockResolvedValueOnce();

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.deleteLehrerByUsername(person.referrer!);

                expect(result.ok).toBeFalsy();
            });
        });
    });

    describe('modifyPersonAttributes', () => {
        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    return clientMock;
                });
                const result: Result<PersonReferrer> = await ldapClientService.modifyPersonAttributes(
                    faker.internet.userName(),
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when person cannot be found by personID', () => {
            it('should return LdapSearchError', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<PersonReferrer> = await ldapClientService.modifyPersonAttributes(
                    faker.internet.userName(),
                );

                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                });
            });
        });
        describe('when person can be found and modified', () => {
            beforeEach(() => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    dn: faker.string.numeric(8),
                                }),
                            ],
                        }),
                    );
                    clientMock.modify.mockResolvedValue();

                    return clientMock;
                });
            });
            describe('when modifying', () => {
                it('Should Update LDAP When called with Attributes', async () => {
                    const oldUsername: PersonReferrer = faker.internet.userName();
                    const newGivenName: string = faker.person.firstName();
                    const newSn: string = faker.person.lastName();
                    const newUid: string = faker.string.alphanumeric(6);
                    const result: Result<PersonReferrer> = await ldapClientService.modifyPersonAttributes(
                        oldUsername,
                        newGivenName,
                        newSn,
                        newUid,
                    );

                    expect(result.ok).toBeTruthy();

                    const expectedModifications: Change[] = [
                        new Change({
                            operation: 'replace',
                            modification: new Attribute({
                                type: 'cn',
                                values: [newUid],
                            }),
                        }),
                        new Change({
                            operation: 'replace',
                            modification: new Attribute({
                                type: 'givenName',
                                values: [newGivenName],
                            }),
                        }),
                        new Change({
                            operation: 'replace',
                            modification: new Attribute({
                                type: 'sn',
                                values: [newSn],
                            }),
                        }),
                    ];

                    expect(clientMock.modify).toHaveBeenCalledWith(expect.any(String), expectedModifications);
                    expect(clientMock.modifyDN).toHaveBeenCalledTimes(1);
                });

                it('Should Do nothing when called with No Attributes', async () => {
                    const result: Result<PersonReferrer> = await ldapClientService.modifyPersonAttributes(
                        faker.internet.userName(),
                    );
                    expect(result.ok).toBeTruthy();
                    expect(clientMock.modify).not.toHaveBeenCalled();
                    expect(clientMock.modifyDN).not.toHaveBeenCalled();
                });

                it('should return error if updateMemberDnInGroups fails', async () => {
                    const oldUsername: PersonReferrer = faker.internet.userName();
                    const newUid: string = faker.string.alphanumeric(6);

                    jest.spyOn(ldapClientService, 'updateMemberDnInGroups').mockResolvedValue({
                        ok: false,
                        error: new Error('Failed to update groups'),
                    });

                    const result: Result<PersonReferrer> = await ldapClientService.modifyPersonAttributes(
                        oldUsername,
                        undefined,
                        undefined,
                        newUid,
                    );

                    assert(!result.ok);
                    expect(result.error.message).toBe('Failed to update groups');
                    expect(loggerMock.error).toHaveBeenCalledWith(
                        `LDAP: Failed to update groups for person: ${oldUsername}`,
                    );
                });
            });
        });
    });

    describe('getPersonAttributes', () => {
        const username: PersonReferrer = faker.internet.userName();
        const personId: PersonID = faker.string.uuid();
        const dn: string = 'dn';
        const oeffentlicheSchulenDoamin: string = 'schule-sh.de';
        const givenName: string = faker.person.firstName();
        const sn: string = faker.person.lastName();
        const cn: string = username;
        const mailPrimaryAddress: string = faker.internet.email();
        const mailAlternativeAddress: string = faker.internet.email();
        let entry: Entry;

        function mockEntryCanBeFound(): void {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [entry],
                    }),
                );
                return clientMock;
            });
        }
        beforeEach(() => {
            entry = getPersonEntry(dn, givenName, sn, cn, mailPrimaryAddress, mailAlternativeAddress);
        });

        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());

                    return clientMock;
                });
                const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                    personId,
                    username,
                    oeffentlicheSchulenDoamin,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when fetching person-attributes finds NO PersonEntry', () => {
            describe('when implicit creation of empty PersonEntry fails because bind fails', () => {
                it('should log error and return', async () => {
                    const bindError: Error = Error('Bind failed');
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [],
                            }),
                        );
                        clientMock.bind.mockRejectedValueOnce(bindError);

                        return clientMock;
                    });
                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );
                    const lehrerUid: string = `uid=${username},ou=oeffentlicheSchulen,dc=example,dc=com`;

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Fetching person-attributes FAILED, no entry for username:${username}, personId:${personId}`,
                    );
                    expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(`Could not connect to LDAP`, bindError);
                    expect(loggerMock.info).not.toHaveBeenCalledWith(
                        `LDAP: Successfully created empty PersonEntry, DN:${lehrerUid}`,
                    );
                    expect(result.ok).toBeFalsy();
                    expect(result).toEqual({
                        ok: false,
                        error: new Error('LDAP bind FAILED'),
                    });
                });
            });

            describe('when implicit creation of empty PersonEntry fails because rootName CANNOT be chosen', () => {
                it('should log error and return', async () => {
                    const invalidEmailDomain: string = 'not-a-valid-domain.de';
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [],
                            }),
                        );

                        return clientMock;
                    });

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        invalidEmailDomain,
                    );
                    const lehrerUid: string = `uid=${username},ou=oeffentlicheSchulen,dc=example,dc=com`;

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Fetching person-attributes FAILED, no entry for username:${username}, personId:${personId}`,
                    );
                    expect(loggerMock.error).toHaveBeenCalledWith(
                        `Could not get root-name because email-domain is invalid, domain:${invalidEmailDomain}`,
                    );
                    expect(loggerMock.info).not.toHaveBeenCalledWith(
                        `LDAP: Successfully created empty PersonEntry, DN:${lehrerUid}`,
                    );
                    expect(result.ok).toBeFalsy();
                    expect(result).toEqual({
                        ok: false,
                        error: new LdapEmailDomainError(),
                    });
                });
            });

            describe('when implicit creation of empty PersonEntry succeeds', () => {
                it('should log info and return DN for PersonEntry', async () => {
                    const newEntryUUID: string = faker.string.uuid();
                    const entryUUIDSearchEntry: Entry = createMock<Entry>({
                        dn: dn,
                        entryUUID: newEntryUUID,
                    });
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [],
                            }),
                        );
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [entryUUIDSearchEntry],
                            }),
                        );

                        return clientMock;
                    });

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );
                    const lehrerUid: string = `uid=${username},ou=oeffentlicheSchulen,dc=example,dc=com`;

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Fetching person-attributes FAILED, no entry for username:${username}, personId:${personId}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `LDAP: Successfully created empty PersonEntry, DN:${lehrerUid}`,
                    );
                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        value: {
                            entryUUID: newEntryUUID,
                            dn: lehrerUid,
                        },
                    });
                });
            });

            describe('when implicit creation of empty PersonEntry succeeds but entryUUID COULD NOT be fetched', () => {
                it('should log error about failing fetch of entryUUID and return DN for PersonEntry', async () => {
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [],
                            }),
                        );
                        //mock: 2. search-request == entryUUID-search return no result
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [],
                            }),
                        );

                        return clientMock;
                    });

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );
                    const lehrerUid: string = `uid=${username},ou=oeffentlicheSchulen,dc=example,dc=com`;

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Fetching person-attributes FAILED, no entry for username:${username}, personId:${personId}`,
                    );
                    expect(loggerMock.error).toHaveBeenCalledWith(
                        `Could not get EntryUUID for username:${username}, personId:${personId}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `LDAP: Successfully created empty PersonEntry, DN:${lehrerUid}`,
                    );
                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        value: {
                            dn: lehrerUid,
                        },
                    });
                });
            });

            describe('when implicit creation of empty PersonEntry fails', () => {
                const ldapAddError: Error = Error('Create user failed');
                it('should log error and return Result with Error', async () => {
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [],
                            }),
                        );
                        clientMock.add.mockRejectedValueOnce(ldapAddError);

                        return clientMock;
                    });

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );
                    const lehrerUid: string = `uid=${username},ou=oeffentlicheSchulen,dc=example,dc=com`;

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Fetching person-attributes FAILED, no entry for username:${username}, personId:${personId}`,
                    );
                    expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                        `LDAP: Creating empty PersonEntry FAILED, DN:${lehrerUid}`,
                        ldapAddError,
                    );
                    expect(result.ok).toBeFalsy();
                    expect(result).toEqual({
                        ok: false,
                        error: new LdapCreateLehrerError(),
                    });
                });
            });
        });

        describe('when fetching all attributes succeeds', () => {
            it('should return person-attributes', async () => {
                entry = getPersonEntry(dn, givenName, sn, cn, mailPrimaryAddress, mailAlternativeAddress);
                mockEntryCanBeFound();

                const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                    personId,
                    username,
                    oeffentlicheSchulenDoamin,
                );

                expect(result.ok).toBeTruthy();
                expect(result).toEqual({
                    ok: true,
                    value: {
                        dn: dn,
                        givenName: givenName,
                        cn: cn,
                        surName: sn,
                        mailPrimaryAddress: mailPrimaryAddress,
                        mailAlternativeAddress: mailAlternativeAddress,
                    },
                });
            });
        });

        describe('when fetching a certain attribute fails', () => {
            describe('when fetching givenName fails', () => {
                it('should log error and return LdapFetchAttributeError', async () => {
                    entry = getPersonEntry(dn, undefined, sn, cn, mailPrimaryAddress, mailAlternativeAddress);
                    mockEntryCanBeFound();

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `GivenName was undefined, username:${username}, personId:${personId}`,
                    );
                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        value: expect.objectContaining({
                            givenName: undefined,
                        }),
                    });
                });
            });

            describe('when fetching surName fails', () => {
                it('should log error and return LdapFetchAttributeError', async () => {
                    entry = getPersonEntry(dn, givenName, undefined, cn, mailPrimaryAddress, mailAlternativeAddress);
                    mockEntryCanBeFound();

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Surname was undefined, username:${username}, personId:${personId}`,
                    );
                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        value: expect.objectContaining({
                            surName: undefined,
                        }),
                    });
                });
            });

            describe('when fetching cn fails', () => {
                it('should log error and return LdapFetchAttributeError', async () => {
                    entry = getPersonEntry(dn, givenName, sn, undefined, mailPrimaryAddress, mailAlternativeAddress);
                    mockEntryCanBeFound();

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `CN was undefined, username:${username}, personId:${personId}`,
                    );
                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        value: expect.objectContaining({
                            cn: undefined,
                        }),
                    });
                });
            });

            describe('when fetching mailPrimaryAddress fails', () => {
                it('should log error and return LdapFetchAttributeError', async () => {
                    entry = getPersonEntry(dn, givenName, sn, cn, undefined, mailAlternativeAddress);
                    mockEntryCanBeFound();

                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );

                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `MailPrimaryAddress was undefined, username:${username}, personId:${personId}`,
                    );
                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        value: expect.objectContaining({
                            mailPrimaryAddress: undefined,
                        }),
                    });
                });
            });

            describe('when fetching mailAlternativeAddress fails', () => {
                it('should log error but return person-attributes', async () => {
                    entry = getPersonEntry(dn, givenName, sn, cn, mailPrimaryAddress, undefined);
                    mockEntryCanBeFound();
                    const result: Result<LdapPersonAttributes> = await ldapClientService.getPersonAttributes(
                        personId,
                        username,
                        oeffentlicheSchulenDoamin,
                    );

                    expect(result.ok).toBeTruthy();
                    expect(result).toEqual({
                        ok: true,
                        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        value: expect.objectContaining({
                            mailAlternativeAddress: undefined,
                        }),
                    });
                });
            });
        });
    });

    describe('setMailAlternativeAddress', () => {
        const username: PersonReferrer = faker.internet.userName();
        const personId: PersonID = faker.string.uuid();
        const dn: string = 'dn';
        const newMailAlternativeAddress: string = 'newMailAlternativeAddress@schule-sh.de';
        const givenName: string = faker.person.firstName();
        const sn: string = faker.person.lastName();
        const cn: string = username;
        const mailPrimaryAddress: string = faker.internet.email();
        const mailAlternativeAddress: string = faker.internet.email();
        const entry: Entry = getPersonEntry(dn, givenName, sn, cn, mailPrimaryAddress, mailAlternativeAddress);

        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.setMailAlternativeAddress(
                    personId,
                    username,
                    newMailAlternativeAddress,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when fetching person-attributes finds NO PersonEntry', () => {
            it('should log error and return', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.setMailAlternativeAddress(
                    personId,
                    username,
                    newMailAlternativeAddress,
                );

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Fetching person FAILED, no entry for username:${username}, personId:${personId}`,
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${personId}, username:${username}`,
                );
                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new LdapModifyEmailError(),
                });
            });
        });

        describe('when modifying mailAlternativeAddress fails', () => {
            it('should log error and return error', async () => {
                const thrownError: Error = new Error();
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [entry],
                        }),
                    );
                    clientMock.modify.mockRejectedValueOnce(new Error());

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.setMailAlternativeAddress(
                    personId,
                    username,
                    newMailAlternativeAddress,
                );

                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `LDAP: Modifying mailPrimaryAddress and mailAlternativeAddress FAILED`,
                    thrownError,
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${personId}, username:${username}`,
                );
                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new LdapModifyEmailError(),
                });
            });
        });

        describe('when modifying mailAlternativeAddress succeeds', () => {
            it('should log info and return PersonId', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [entry],
                        }),
                    );

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.setMailAlternativeAddress(
                    personId,
                    username,
                    newMailAlternativeAddress,
                );

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${personId}, username:${username}`,
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledTimes(0);
                expect(result.ok).toBeTruthy();
                expect(result).toEqual({
                    ok: true,
                    value: personId,
                });
            });
        });
    });

    describe('getGroupsForPerson', () => {
        const username: PersonReferrer = faker.internet.userName();
        const personId: PersonID = faker.string.uuid();
        const dn: string = 'dn';
        const givenName: string = faker.person.firstName();
        const sn: string = faker.person.lastName();
        const cn: string = username;
        const mailPrimaryAddress: string = faker.internet.email();
        const mailAlternativeAddress: string = faker.internet.email();
        let entry: Entry;

        beforeEach(() => {
            entry = getPersonEntry(dn, givenName, sn, cn, mailPrimaryAddress, mailAlternativeAddress);
        });

        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    return clientMock;
                });
                const result: Result<string[]> = await ldapClientService.getGroupsForPerson(personId, username);

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when user CANNOT be found', () => {
            it('should return LdapSearchError', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    return clientMock;
                });
                const result: Result<string[]> = await ldapClientService.getGroupsForPerson(personId, username);

                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                });
            });
        });

        describe('when fetching groups fails', () => {
            it('should return error', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [entry],
                        }),
                    );
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: undefined,
                        }),
                    );
                    return clientMock;
                });
                const result: Result<string[]> = await ldapClientService.getGroupsForPerson(personId, username);
                const errMsg: string = `LDAP: Fetching groups failed, personId:${personId}, username:${username}`;

                expect(loggerMock.error).toHaveBeenCalledWith(errMsg);
                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new Error(errMsg),
                });
            });
        });

        describe('when no groups were found', () => {
            it('should return empty list', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [entry],
                        }),
                    );
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<string[]> = await ldapClientService.getGroupsForPerson(personId, username);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `LDAP: No groups found for person, personId:${personId}, username:${username}`,
                );
                expect(result.ok).toBeTruthy();
                expect(result).toEqual({
                    ok: true,
                    value: [],
                });
            });
        });

        describe('when groups were found', () => {
            const groupEntry1: Entry = createMock<Entry>({
                dn: 'group1',
            });
            const groupEntry2: Entry = createMock<Entry>({
                dn: 'group2',
            });
            it('should return group-names as list', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [entry],
                        }),
                    );
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [groupEntry1, groupEntry2],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<string[]> = await ldapClientService.getGroupsForPerson(personId, username);

                expect(result.ok).toBeTruthy();
                expect(result).toEqual({
                    ok: true,
                    value: ['group1', 'group2'],
                });
            });
        });
    });

    describe('changeEmailAddressByPersonId', () => {
        const fakeUsername: PersonReferrer = faker.internet.userName();
        const fakePersonID: string = faker.string.uuid();
        const fakeDN: string = faker.string.alpha();
        const newEmailAddress: string = 'new-address@schule-sh.de';
        const currentEmailAddress: string = 'current-address@schule-sh.de';
        const fakeSchuleSHAddress: string = 'user@schule-sh.de';

        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                    fakeSchuleSHAddress,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when person can not be found in DB', () => {
            it('should return falsy result', async () => {
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                    fakeSchuleSHAddress,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when called with invalid emailDomain', () => {
            it('should return LdapEmailDomainError', async () => {
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                    'user@wrong-email-domain.de',
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });
        });

        describe('when called with newEmailAddress that is not splittable', () => {
            it('should return LdapEmailAddressError', async () => {
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                    'user-at-wrong-email-domain.de',
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailAddressError);
            });
        });

        describe('when person cannot be found by personID', () => {
            it('should return LdapSearchError', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                    fakeSchuleSHAddress,
                );

                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                });
            });
        });

        describe('when person can be found but modification fails', () => {
            it('should set mailAlternativeAddress as current mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                const error: Error = new Error();
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    dn: fakeDN,
                                    mailPrimaryAddress: currentEmailAddress,
                                }),
                            ],
                        }),
                    );
                    clientMock.modify.mockRejectedValueOnce(new Error());

                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    fakePersonID,
                    faker.internet.userName(),
                    newEmailAddress,
                );

                assert(!result.ok);
                expect(result.error).toStrictEqual(new LdapModifyEmailError());
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `LDAP: Modifying mailPrimaryAddress and mailAlternativeAddress FAILED`,
                    error,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });

        describe('when person can be found and modified', () => {
            describe('and already has a mailPrimaryAddress', () => {
                it('should set mailAlternativeAddress as current mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [
                                    createMock<Entry>({
                                        dn: fakeDN,
                                        mailPrimaryAddress: currentEmailAddress,
                                    }),
                                ],
                            }),
                        );
                        clientMock.modify.mockResolvedValue();

                        return clientMock;
                    });
                    const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                        fakePersonID,
                        fakeUsername,
                        newEmailAddress,
                    );

                    expect(result.ok).toBeTruthy();
                    expect(loggerMock.info).toHaveBeenLastCalledWith(
                        `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${fakePersonID}, username:${fakeUsername}`,
                    );
                    expect(eventServiceMock.publish).toHaveBeenCalledWith(
                        expect.objectContaining({
                            personId: fakePersonID,
                            mailPrimaryAddress: newEmailAddress,
                            mailAlternativeAddress: currentEmailAddress,
                        }),
                    );
                });
            });

            describe('and searchResult is array', () => {
                describe('and already has a mailPrimaryAddress', () => {
                    it('should set mailAlternativeAddress as current mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                        ldapClientMock.getClient.mockImplementation(() => {
                            clientMock.bind.mockResolvedValueOnce();
                            clientMock.search.mockResolvedValueOnce(
                                createMock<SearchResult>({
                                    searchEntries: [
                                        createMock<Entry>({
                                            dn: fakeDN,
                                            mailPrimaryAddress: [currentEmailAddress],
                                        }),
                                    ],
                                }),
                            );
                            clientMock.modify.mockResolvedValue();

                            return clientMock;
                        });
                        const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                            fakePersonID,
                            fakeUsername,
                            newEmailAddress,
                        );

                        expect(result.ok).toBeTruthy();
                        expect(loggerMock.info).toHaveBeenLastCalledWith(
                            `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${fakePersonID}, username:${fakeUsername}`,
                        );
                        expect(eventServiceMock.publish).toHaveBeenCalledWith(
                            expect.objectContaining({
                                personId: fakePersonID,
                                mailPrimaryAddress: newEmailAddress,
                                mailAlternativeAddress: currentEmailAddress,
                            }),
                        );
                    });
                });
            });

            describe('but does NOT have a mailPrimaryAddress', () => {
                it('should set mailAlternativeAddress to same value as mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [
                                    createMock<Entry>({
                                        dn: fakeDN,
                                        mailPrimaryAddress: undefined,
                                    }),
                                ],
                            }),
                        );
                        clientMock.modify.mockResolvedValue();

                        return clientMock;
                    });
                    const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                        fakePersonID,
                        fakeUsername,
                        newEmailAddress,
                    );

                    expect(result.ok).toBeTruthy();
                    expect(loggerMock.info).toHaveBeenLastCalledWith(
                        `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${fakePersonID}, username:${fakeUsername}`,
                    );
                    expect(eventServiceMock.publish).toHaveBeenCalledWith(
                        expect.objectContaining({
                            personId: fakePersonID,
                            mailPrimaryAddress: newEmailAddress,
                            mailAlternativeAddress: newEmailAddress,
                        }),
                    );
                });
            });
        });
    });

    describe('removePersonFromGroup', () => {
        const fakeGroupId: string = 'lehrer-123';
        const fakePersonUid: string = 'user123';
        const fakeGroupDn: string = `cn=${fakeGroupId},${mockLdapInstanceConfig.BASE_DN}`;
        const fakeLehrerUid: string = `uid=${fakePersonUid},ou=users,${mockLdapInstanceConfig.BASE_DN}`;
        const fakeDienstStellenNummer: string = '123';

        it('should successfully remove person from group with multiple members', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                                member: [
                                    `${fakeLehrerUid}`,
                                    'uid=otherUser,ou=users,' + mockLdapInstanceConfig.BASE_DN,
                                ],
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'delete',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeLehrerUid],
                    }),
                }),
            ]);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully removed person ${fakePersonUid} from group ${fakeGroupId}`,
            );
        });

        it('should delete the group when only one member is present', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                                member: `${fakeLehrerUid}`,
                            }),
                        ],
                    }),
                );
                clientMock.del.mockResolvedValueOnce();

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.del).toHaveBeenCalledWith(fakeGroupDn);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully removed person ${fakePersonUid} from group ${fakeGroupId}`,
            );
            expect(loggerMock.info).toHaveBeenCalledWith(`LDAP: Successfully deleted group ${fakeGroupId}`);
        });

        it('should return error when group is not found', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [],
                    }),
                );

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(Error);
        });

        it('should return error when bind fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockRejectedValueOnce(new Error());
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(Error);
        });

        it('should return error when modification fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                                member: [
                                    `${fakeLehrerUid}`,
                                    'uid=otherUser,ou=users,' + mockLdapInstanceConfig.BASE_DN,
                                ],
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockRejectedValueOnce(new Error('Modify error'));

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(LdapRemovePersonFromGroupError);
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LDAP: Failed to remove person from group ${fakeGroupId}, errMsg: Error: Modify error`,
            );
        });

        it('should return false when person is not in group (member as string)', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce({
                    searchEntries: [
                        {
                            dn: fakeGroupDn,
                            member: `uid=other-user,ou=users,${mockLdapInstanceConfig.BASE_DN}`,
                        },
                    ],
                    searchReferences: [],
                });
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(Error);
            expect(result.error?.message).toContain(`Person ${fakePersonUid} is not in group ${fakeGroupId}`);
        });

        it('should return true when person is in group (member as Buffer)', async () => {
            const bufferMember: Buffer = Buffer.from(`uid=${fakePersonUid},ou=users,${mockLdapInstanceConfig.BASE_DN}`);
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce({
                    searchEntries: [
                        {
                            dn: fakeGroupDn,
                            member: bufferMember,
                        },
                    ],
                    searchReferences: [],
                });
                clientMock.del.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully removed person ${fakePersonUid} from group ${fakeGroupId}`,
            );
        });

        it('should return undefined when searchEntries is empty', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce({
                    searchEntries: [], // Leere Suchergebnisse
                    searchReferences: [],
                });

                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(Error);
            expect(result.error?.message).toContain(`Group ${fakeGroupId} not found`);
        });

        it('should return true when person is in group (member as Buffer array)', async () => {
            const bufferMemberArray: Buffer[] = [
                Buffer.from(`uid=${fakePersonUid},ou=users,${mockLdapInstanceConfig.BASE_DN}`),
                Buffer.from(`uid=other-user,ou=users,${mockLdapInstanceConfig.BASE_DN}`),
            ];

            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce({
                    searchEntries: [
                        {
                            dn: fakeGroupDn,
                            member: bufferMemberArray,
                        },
                    ],
                    searchReferences: [],
                });
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeLehrerUid,
            );

            expect(result.ok).toBeTruthy();
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully removed person ${fakePersonUid} from group ${fakeGroupId}`,
            );
        });
    });

    // hence removePersonFromGroupByUsernameAndKennung uses removePersonFromGroup, test is very basic
    describe('removePersonFromGroupByUsernameAndKennung', () => {
        const fakeGroupId: string = 'lehrer-123';
        const fakePersonUid: string = 'user123';
        const fakeGroupDn: string = `cn=${fakeGroupId},${mockLdapInstanceConfig.BASE_DN}`;
        const fakeLehrerUid: string = `uid=${fakePersonUid},ou=oeffentlicheSchulen,${mockLdapInstanceConfig.BASE_DN}`;
        const fakeDienstStellenNummer: string = '123';
        const fakeValidDomain: string = 'schule-sh.de';
        const fakeInvalidDomain: string = 'not-a-valid-domain-sh.de';

        it('should successfully remove person from group with multiple members', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                                member: [
                                    `${fakeLehrerUid}`,
                                    'uid=otherUser,ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN,
                                ],
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.removePersonFromGroupByUsernameAndKennung(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeValidDomain,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'delete',
                    modification: new Attribute({
                        type: 'member',
                        values: [fakeLehrerUid],
                    }),
                }),
            ]);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully removed person ${fakePersonUid} from group ${fakeGroupId}`,
            );
        });

        it('should return error when getting root-name fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                                member: [
                                    `${fakeLehrerUid}`,
                                    'uid=otherUser,ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN,
                                ],
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.removePersonFromGroupByUsernameAndKennung(
                fakePersonUid,
                fakeDienstStellenNummer,
                fakeInvalidDomain,
            );

            expect(result.ok).toBeFalsy();
            expect(clientMock.modify).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenCalledWith(
                `Could not get root-name because email-domain is invalid, domain:${fakeInvalidDomain}`,
            );
        });
    });

    describe('changeUserPasswordByPersonId', () => {
        let fakePersonID: string;
        let fakeUsername: PersonReferrer;
        let fakeDN: string;

        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.changeUserPasswordByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when person cannot be found by personID', () => {
            it('should return LdapSearchError', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [],
                        }),
                    );
                    return clientMock;
                });

                const result: Result<PersonID> = await ldapClientService.changeUserPasswordByPersonId(
                    faker.string.uuid(),
                    faker.internet.userName(),
                );

                expect(result.ok).toBeFalsy();
                expect(result).toEqual({
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                });
            });
        });

        describe('when person can be found but modification fails', () => {
            fakePersonID = faker.string.uuid();
            fakeUsername = faker.internet.userName();
            fakeDN = faker.string.alpha();

            it('should NOT publish event and throw LdapPersonEntryChangedEvent', async () => {
                const error: Error = new Error();
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(
                        createMock<SearchResult>({
                            searchEntries: [
                                createMock<Entry>({
                                    dn: fakeDN,
                                }),
                            ],
                        }),
                    );
                    clientMock.modify.mockRejectedValueOnce(error);

                    return clientMock;
                });

                const result: Result<PersonID> = await ldapClientService.changeUserPasswordByPersonId(
                    fakePersonID,
                    fakeUsername,
                );

                assert(!result.ok);
                expect(result.error).toStrictEqual(new LdapModifyUserPasswordError());
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `LDAP: Modifying userPassword (UEM) FAILED for personId:${fakePersonID}, username:${fakeUsername}`,
                    error,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });

        describe('when person can be found and userPassword can be modified', () => {
            beforeEach(() => {
                fakePersonID = faker.string.uuid();
                fakeUsername = faker.internet.userName();
                fakeDN = faker.string.alpha();
            });

            describe('when', () => {
                it('should publish event and return new (UEM) userPassword', async () => {
                    ldapClientMock.getClient.mockImplementation(() => {
                        clientMock.bind.mockResolvedValueOnce();
                        clientMock.search.mockResolvedValueOnce(
                            createMock<SearchResult>({
                                searchEntries: [
                                    createMock<Entry>({
                                        dn: fakeDN,
                                    }),
                                ],
                            }),
                        );
                        clientMock.modify.mockResolvedValueOnce(undefined);

                        return clientMock;
                    });

                    const result: Result<PersonID> = await ldapClientService.changeUserPasswordByPersonId(
                        fakePersonID,
                        fakeUsername,
                    );

                    assert(result.ok);
                    expect(result.value.length).toBeGreaterThanOrEqual(8);
                    expect(loggerMock.info).toHaveBeenLastCalledWith(
                        `LDAP: Successfully modified userPassword (UEM) for personId:${fakePersonID}, username:${fakeUsername}`,
                    );
                    expect(eventServiceMock.publish).toHaveBeenCalledTimes(1);
                });
            });
        });
    });
    describe('createNewLehrerUidFromOldUid', () => {
        it('should replace the old uid with the new username and join the DN parts with commas', () => {
            const oldUid: string = 'uid=oldUser,ou=users,dc=example,dc=com';
            const newUsername: PersonReferrer = 'newUser';
            const result: string = ldapClientService.createNewLehrerUidFromOldUid(oldUid, newUsername);

            expect(result).toBe('uid=newUser,ou=users,dc=example,dc=com');
        });

        it('should handle a DN with only a uid component', () => {
            const oldUid: string = 'uid=oldUser';
            const newUsername: PersonReferrer = 'newUser';
            const result: string = ldapClientService.createNewLehrerUidFromOldUid(oldUid, newUsername);

            expect(result).toBe('uid=newUser');
        });

        it('should handle an empty DN string', () => {
            const oldUid: string = '';
            const newUsername: PersonReferrer = 'newUser';
            const result: string = ldapClientService.createNewLehrerUidFromOldUid(oldUid, newUsername);

            expect(result).toBe('uid=newUser');
        });
    });
});

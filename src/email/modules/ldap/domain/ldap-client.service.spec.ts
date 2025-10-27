import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailLdapConfigModule } from '../ldap-config.module.js';
import { EmailLdapModule } from '../email-ldap.module.js';
import { faker } from '@faker-js/faker';
import { LdapClientService, PersonData } from './ldap-client.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClient } from './ldap-client.js';
import { Client, Entry, SearchResult } from 'ldapts';
import { LdapEmailDomainError } from '../error/ldap-email-domain.error.js';
import { LdapCreatePersonError } from '../error/ldap-create-person.error.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import assert from 'assert';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { DatabaseTestModule } from '../../../../../test/utils/database-test.module.js';
import { ConfigTestModule } from '../../../../../test/utils/config-test.module.js';
import { GlobalValidationPipe } from '../../../../shared/validation/index.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../../test/utils/index.js';

describe('LDAP Client Service', () => {
    let app: INestApplication;
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let ldapClientService: LdapClientService;
    let ldapClientMock: DeepMocked<LdapClient>;
    let loggerMock: DeepMocked<ClassLogger>;
    let clientMock: DeepMocked<Client>;
    let instanceConfig: LdapInstanceConfig;

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
     * Returns a PersonData-object, id, vorname, familienname, username, ldapEntryUUID will be filled with faker-values when not defined.
     * The ldapEntryUUID has no default!
     */
    function getPersonData(firstName?: string, lastName?: string, uid?: string): PersonData {
        return {
            firstName: firstName ?? faker.person.firstName(),
            lastName: lastName ?? faker.person.lastName(),
            uid: uid ?? faker.internet.userName(),
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

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                EmailLdapModule,
                EmailLdapConfigModule,
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
            .overrideProvider(LdapClient)
            .useValue(createMock<LdapClient>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(LdapInstanceConfig)
            .useValue(mockLdapInstanceConfig)
            .compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        ldapClientService = module.get(LdapClientService);
        ldapClientMock = module.get(LdapClient);
        loggerMock = module.get(ClassLogger);
        clientMock = createMock<Client>();
        instanceConfig = module.get(LdapInstanceConfig);

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    describe('getRootName', () => {
        it('when emailDomain is neither schule-sh.de nor ersatzschule-sh.de should return LdapEmailDomainError', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isPersonExisting('user123', 'wrong-domain.de');

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

            const resultOeffentlich: Result<boolean> = await ldapClientService.isPersonExisting(
                'user123',
                'weird-domain.ina.foreign.country.co.uk',
            );

            const resultErsatz: Result<boolean> = await ldapClientService.isPersonExisting(
                'user123',
                'normaldomain.co.jp',
            );
            const resultOldDefault: Result<boolean> = await ldapClientService.isPersonExisting(
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

    describe('isPersonExisting', () => {
        it('should return true when the person exists', async () => {
            const uid: string = faker.string.uuid();
            const domain: string = 'schule-sh.de';
            const rootName: string = 'oeffentlicheSchulen';
            const baseDn: string = mockLdapInstanceConfig.BASE_DN;

            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockResolvedValueOnce({
                    searchEntries: [{ dn: `uid=${uid},ou=${rootName},${baseDn}` }],
                } as SearchResult);
                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.isPersonExisting(uid, domain);

            expect(result.ok).toBeTruthy();
            if (result.ok) {
                expect(result.value).toBe(true);
            }
            expect(clientMock.search).toHaveBeenCalledWith(`ou=${rootName},${baseDn}`, { filter: `(uid=${uid})` });
        });

        it('should return false when the person exists', async () => {
            const uid: string = faker.string.uuid();
            const domain: string = 'schule-sh.de';
            const rootName: string = 'oeffentlicheSchulen';
            const baseDn: string = mockLdapInstanceConfig.BASE_DN;

            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockResolvedValueOnce({
                    searchEntries: [],
                } as unknown as SearchResult);
                return clientMock;
            });

            const result: Result<boolean> = await ldapClientService.isPersonExisting(uid, domain);

            expect(result.ok).toBeTruthy();
            if (result.ok) {
                expect(result.value).toBe(false);
            }
            expect(clientMock.search).toHaveBeenCalledWith(`ou=${rootName},${baseDn}`, { filter: `(uid=${uid})` });
        });

        it('should return error result when bind fails', async () => {
            const uid: string = faker.string.uuid();
            const domain: string = 'schule-sh.de';

            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockRejectedValueOnce(undefined);
                return clientMock;
            });

            jest.restoreAllMocks();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(ldapClientService as unknown as any, 'bind').mockResolvedValue({
                ok: false,
                error: new Error('bind failed'),
            });

            const result: Result<boolean> = await ldapClientService.isPersonExisting(uid, domain);

            expect(result.ok).toBeFalsy();
            if (!result.ok) {
                expect(result.error).toEqual(new Error('bind failed'));
            }
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
            const result: Result<boolean> = await ldapClientService.isPersonExisting(
                faker.lorem.word(),
                'schule-sh.de',
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.bind).toHaveBeenCalledTimes(1);
            expect(loggerMock.logUnknownAsError).not.toHaveBeenCalledWith(expect.stringContaining('Attempt 1 failed'));
        });

        it('should throw an error when the function returns a Result with ok=false and handle it with retry', async () => {
            jest.restoreAllMocks();
            ldapClientMock.getClient.mockReturnValue(clientMock);
            clientMock.bind.mockResolvedValue(undefined);
            const customError: Error = new Error('custom error');

            const failingFunc: () => Promise<Result<unknown, Error>> = jest
                .fn()
                .mockResolvedValue({ ok: false, error: customError });

            await expect(ldapClientService['executeWithRetry'](failingFunc, 1)).resolves.toEqual({
                ok: false,
                error: customError,
            });
        });

        it('when operation fails it should automatically retry the operation with nr of fallback retries and log error', async () => {
            instanceConfig.RETRY_WRAPPER_DEFAULT_RETRIES = undefined;
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockRejectedValue(new Error('testerror'));

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isPersonExisting(
                faker.lorem.word(),
                'schule-sh.de',
            );

            expect(result.ok).toBeFalsy();
            expect(clientMock.bind).toHaveBeenCalledTimes(3);
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                expect.stringContaining('Attempt 1 failed'),
                expect.objectContaining({ message: 'testerror' }),
            );
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                expect.stringContaining('Attempt 2 failed'),
                expect.objectContaining({ message: 'testerror' }),
            );
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                expect.stringContaining('Attempt 3 failed'),
                expect.objectContaining({ message: 'testerror' }),
            );
            instanceConfig.RETRY_WRAPPER_DEFAULT_RETRIES = 2;
        });

        it('when operation fails and throws Error it should automatically retry the operation with nr of retries set via env', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.search.mockRejectedValue(new Error());

                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isPersonExisting(
                faker.lorem.word(),
                'schule-sh.de',
            );

            expect(result.ok).toBeFalsy();
            expect(clientMock.bind).toHaveBeenCalledTimes(2);
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                expect.stringContaining('Attempt 1 failed'),
                expect.any(Error),
            );
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                expect.stringContaining('Attempt 2 failed'),
                expect.any(Error),
            );
        });
    });

    describe('creation', () => {
        const fakeEmailDomain: string = 'schule-sh.de';
        const fakeOrgaKennung: string = '123';
        const fakeEmailAddress: string = 'uteste@ersatzschule-sh.de';

        describe('lehrer', () => {
            it('when called with extra entryUUID should return truthy result', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

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
                    'uid=' + testLehrer.uid + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Creating person succeeded, uid:${lehrerUid}`);
            });

            it('when called WITHOUT entryUUID should use person.id and return truthy result', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

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
                    'uid=' + testLehrer.uid + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Creating person succeeded, uid:${lehrerUid}`);
            });

            it('when adding fails should log error', async () => {
                const error: Error = new Error('LDAP-Error');
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.bind.mockResolvedValue();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] }));
                    clientMock.add.mockRejectedValueOnce(error);

                    return clientMock;
                });
                const testLehrer: PersonData = getPersonData();
                const lehrerUid: string =
                    'uid=' + testLehrer.uid + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                assert(!result.ok);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `LDAP: Creating person FAILED, uid:${lehrerUid}`,
                    error,
                );
                expect(result.error).toEqual(new LdapCreatePersonError());
            });

            it('when called with explicit domain "ersatzschule-sh.de" should return truthy result', async () => {
                makeMockClient((client: DeepMocked<Client>) => {
                    mockBind();

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
                    'uid=' + testLehrer.uid + ',ou=ersatzSchulen,' + mockLdapInstanceConfig.BASE_DN;
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    testLehrer,
                    fakeErsatzSchuleAddressDomain,
                    fakeEmailAddress,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Creating person succeeded, uid:${lehrerUid}`);
            });

            it('when lehrer already exists', async () => {
                const personData: PersonData = getPersonData();
                const lehrerUid: string =
                    'uid=' + personData.uid + ',ou=oeffentlicheSchulen,' + mockLdapInstanceConfig.BASE_DN;
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
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    personData,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Person ${lehrerUid} exists, nothing to create`);
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
                personData.uid = undefined as unknown as string;
                const result: Result<PersonData> = await ldapClientService.createPerson(
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
                const testLehrer: PersonData = getPersonData();
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeFalsy();
            });

            it('when called with invalid emailDomain returns LdapEmailDomainError', async () => {
                const testLehrer: PersonData = getPersonData();
                const result: Result<PersonData> = await ldapClientService.createPerson(
                    testLehrer,
                    'wrong-email-domain.de',
                    fakeOrgaKennung,
                );

                assert(!result.ok);
                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });
        });
    });
});

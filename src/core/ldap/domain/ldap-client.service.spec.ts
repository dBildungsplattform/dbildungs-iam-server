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
import { LdapClientService, PersonData } from './ldap-client.service.js';
import { Person } from '../../../modules/person/domain/person.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClient } from './ldap-client.js';
import { Attribute, Change, Client, Entry, SearchResult } from 'ldapts';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { LdapSearchError } from '../error/ldap-search.error.js';
import { LdapEntityType } from './ldap.types.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { EventService } from '../../eventbus/services/event.service.js';
import { LdapEmailDomainError } from '../error/ldap-email-domain.error.js';
import { LdapEmailAddressError } from '../error/ldap-email-address.error.js';
import { LdapCreateLehrerError } from '../error/ldap-create-lehrer.error.js';
import { LdapModifyEmailError } from '../error/ldap-modify-email.error.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import { LdapAddPersonToGroupError } from '../error/ldap-add-person-to-group.error.js';
import { LdapRemovePersonFromGroupError } from '../error/ldap-remove-person-from-group.error.js';

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
    let personRepoMock: DeepMocked<PersonRepository>;
    let instanceConfig: LdapInstanceConfig;

    let person: Person<true>;
    let personWithoutReferrer: Person<true>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LdapModule,
                MapperTestModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
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
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        ldapClientService = module.get(LdapClientService);
        ldapClientMock = module.get(LdapClient);
        loggerMock = module.get(ClassLogger);
        eventServiceMock = module.get(EventService);
        clientMock = createMock<Client>();
        personRepoMock = module.get(PersonRepository);
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
            faker.string.uuid(),
        );
        personWithoutReferrer = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            undefined,
            undefined,
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
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(em).toBeDefined();
    });

    describe('getRootName', () => {
        it('when emailDomain is neither schule-sh.de nor ersatzschule-sh.de should return LdapEmailDomainError', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }),
                );
                return clientMock;
            });
            const result: Result<boolean> = await ldapClientService.isLehrerExisting('user123', 'wrong-domain.de');

            if (result.ok) throw Error();

            expect(result.error).toBeInstanceOf(LdapEmailDomainError);
        });

        it('when emailDomain is one that is explicitly set in config but neither schule-sh.de nor ersatzschule-sh.de it should go through', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValue();
                clientMock.add.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({ searchEntries: [createMock<Entry>()] }),
                );
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

            if (result.ok) throw Error();

            expect(result.error).toBeInstanceOf(LdapEmailDomainError);
        });
    });

    describe('addPersonToGroup', () => {
        const fakePersonUid: string = 'test-user';
        const fakeSchoolId: string = '123';
        const fakeGroupId: string = `lehrer-${fakeSchoolId}`;
        const fakeGroupDn: string = `cn=${fakeGroupId},dc=schule-sh,dc=de`;

        it('should successfully add a person to an existing group', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockResolvedValueOnce();
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.addPersonToGroup(
                fakePersonUid,
                fakeSchoolId,
            );

            expect(result.ok).toBeTruthy();
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `LDAP: Successfully added person ${fakePersonUid} to group ${fakeGroupId}`,
            );
        });

        it('should create a new group and add the person if the group does not exist', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [],
                    }),
                );
                clientMock.add.mockResolvedValueOnce();
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.addPersonToGroup(
                fakePersonUid,
                fakeSchoolId,
            );

            expect(result.ok).toBeTruthy();
            expect(loggerMock.info).toHaveBeenCalledWith(
                `LDAP: Successfully created group ${fakeGroupId} and added person ${fakePersonUid}`,
            );
        });

        it('should return error if group creation fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [],
                    }),
                );
                clientMock.add.mockRejectedValueOnce(new Error('Group creation failed'));
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.addPersonToGroup(
                fakePersonUid,
                fakeSchoolId,
            );

            expect(result.ok).toBeFalsy();
            if (result.ok) throw Error();
            expect(result.error).toBeInstanceOf(LdapAddPersonToGroupError);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `LDAP: Failed to create group ${fakeGroupId}, errMsg: Error: Group creation failed`,
            );
        });

        it('should return error if person addition to the existing group fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockRejectedValueOnce(new Error('Modify error'));
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.addPersonToGroup(
                fakePersonUid,
                fakeSchoolId,
            );

            expect(result.ok).toBeFalsy();
            if (result.ok) throw Error();
            expect(result.error).toBeInstanceOf(LdapAddPersonToGroupError);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `LDAP: Failed to add person to group ${fakeGroupId}, errMsg: Error: Modify error`,
            );
        });

        it('should return error if bind fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockRejectedValueOnce(new Error());
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.addPersonToGroup(
                fakePersonUid,
                fakeSchoolId,
            );

            expect(result.ok).toBeFalsy();
            if (result.ok) throw Error();
            expect(result.error).toBeInstanceOf(Error);
            expect(loggerMock.error).not.toHaveBeenCalledWith(expect.stringContaining('Failed to add person to group'));
        });
    });

    describe('creation', () => {
        const fakeEmailDomain: string = 'schule-sh.de';
        const fakeOrgaKennung: string = '123';

        describe('lehrer', () => {
            it('when called with extra entryUUID should return truthy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>()); //mock existsLehrer

                    return clientMock;
                });
                const testLehrer: PersonData = {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.lorem.word(),
                    ldapEntryUUID: faker.string.uuid(),
                };
                const lehrerUid: string = 'uid=' + testLehrer.referrer + ',ou=oeffentlicheSchulen,dc=schule-sh,dc=de';
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Successfully created lehrer ${lehrerUid}`);
            });

            it('when called WITHOUT entryUUID should use person.id and return truthy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>()); //mock existsLehrer

                    return clientMock;
                });
                const testLehrer: PersonData = {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.lorem.word(),
                };
                const lehrerUid: string = 'uid=' + testLehrer.referrer + ',ou=oeffentlicheSchulen,dc=schule-sh,dc=de';
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(result.ok).toBeTruthy();
                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Successfully created lehrer ${lehrerUid}`);
            });

            it('when adding fails should log error', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>());
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] })); //mock: lehrer not present
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.add.mockRejectedValueOnce(new Error('LDAP-Error'));

                    return clientMock;
                });
                const testLehrer: PersonData = {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.lorem.word(),
                };
                const lehrerUid: string = 'uid=' + testLehrer.referrer + ',ou=oeffentlicheSchulen,dc=schule-sh,dc=de';
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    testLehrer,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                if (result.ok) throw Error();
                expect(loggerMock.error).toHaveBeenLastCalledWith(
                    `LDAP: Creating lehrer FAILED, uid:${lehrerUid}, errMsg:{}`,
                );
                expect(result.error).toEqual(new LdapCreateLehrerError());
            });

            it('when called with explicit domain "ersatzschule-sh.de" should return truthy result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>()); //mock existsLehrer

                    return clientMock;
                });
                const testLehrer: PersonData = {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.lorem.word(),
                    ldapEntryUUID: faker.string.uuid(),
                };
                const fakeErsatzSchuleAddressDomain: string = 'ersatzschule-sh.de';
                const lehrerUid: string = 'uid=' + testLehrer.referrer + ',ou=ersatzSchulen,dc=schule-sh,dc=de';
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
                const lehrerUid: string = 'uid=' + person.referrer + ',ou=oeffentlicheSchulen,dc=schule-sh,dc=de';
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
                    person,
                    fakeEmailDomain,
                    fakeOrgaKennung,
                );

                expect(loggerMock.info).toHaveBeenLastCalledWith(`LDAP: Lehrer ${lehrerUid} exists, nothing to create`);
                expect(result.ok).toBeTruthy();
            });

            it('when called with person without referrer should return error result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValue();
                    clientMock.add.mockResolvedValueOnce();
                    clientMock.search.mockResolvedValueOnce(createMock<SearchResult>({ searchEntries: [] })); //mock: lehrer not present

                    return clientMock;
                });
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    personWithoutReferrer,
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

            it('when called with invalid emailDomain returns LdapEmailDomainError', async () => {
                const result: Result<PersonData> = await ldapClientService.createLehrer(
                    person,
                    'wrong-email-domain.de',
                    fakeOrgaKennung,
                );

                if (result.ok) throw Error();

                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });

            it('should log an error and return the failed result if addPersonToGroup fails', async () => {
                const referrer: string = 'test-user';
                const schulId: string = '123';
                const expectedGroupId: string = `lehrer-${schulId}`;
                const errorMessage: string = `LDAP: Failed to add lehrer ${referrer} to group ${expectedGroupId}`;

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
                        referrer,
                    },
                    'schule-sh.de',
                    schulId,
                );

                expect(result.ok).toBeFalsy();
                if (result.ok) throw new Error('Test failed because result was unexpectedly successful');
                expect(loggerMock.error).toHaveBeenCalledWith(errorMessage);
                expect(result.error?.message).toContain('Group addition failed');
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
                    return clientMock;
                });

                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    person,
                    fakeOrgaKennung,
                    fakeEmailDomain,
                );

                expect(result.ok).toBeTruthy();
            });

            it('when called with person without referrer should return error result', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockResolvedValueOnce();
                    clientMock.add.mockResolvedValueOnce();
                    return clientMock;
                });
                const result: Result<PersonData> = await ldapClientService.deleteLehrer(
                    personWithoutReferrer,
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

                if (result.ok) throw Error();

                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });
        });

        describe('delete lehrer by referrer', () => {
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
                personRepoMock.findById.mockResolvedValueOnce(person);

                const result: Result<PersonID> = await ldapClientService.deleteLehrerByReferrer(person.referrer!);

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

                const result: Result<PersonID> = await ldapClientService.deleteLehrerByReferrer(person.referrer!);

                expect(result.ok).toBeFalsy();
            });

            it('when bind returns error', async () => {
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    clientMock.add.mockResolvedValueOnce();
                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.deleteLehrerByReferrer(person.referrer!);

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
                const result: Result<PersonID> = await ldapClientService.modifyPersonAttributes(
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

                const result: Result<PersonID> = await ldapClientService.modifyPersonAttributes(
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
                    const oldReferrer: string = faker.internet.userName();
                    const newGivenName: string = faker.person.firstName();
                    const newSn: string = faker.person.lastName();
                    const newUid: string = faker.string.alphanumeric(6);

                    const result: Result<PersonID> = await ldapClientService.modifyPersonAttributes(
                        oldReferrer,
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
                    const result: Result<PersonID> = await ldapClientService.modifyPersonAttributes(
                        faker.internet.userName(),
                    );
                    expect(result.ok).toBeTruthy();
                    expect(clientMock.modify).not.toHaveBeenCalled();
                    expect(clientMock.modifyDN).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('changeEmailAddressByPersonId', () => {
        const fakeSchuleSHAddress: string = 'user@schule-sh.de';

        describe('when bind returns error', () => {
            it('should return falsy result', async () => {
                personRepoMock.findById.mockResolvedValueOnce(person);
                ldapClientMock.getClient.mockImplementation(() => {
                    clientMock.bind.mockRejectedValueOnce(new Error());
                    return clientMock;
                });
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    fakeSchuleSHAddress,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when person can not be found in DB', () => {
            it('should return falsy result', async () => {
                personRepoMock.findById.mockResolvedValueOnce(undefined);
                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    fakeSchuleSHAddress,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when called with invalid emailDomain', () => {
            it('should return LdapEmailDomainError', async () => {
                personRepoMock.findById.mockResolvedValueOnce(person);

                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    'user@wrong-email-domain.de',
                );

                if (result.ok) throw Error();

                expect(result.error).toBeInstanceOf(LdapEmailDomainError);
            });
        });

        describe('when called with newEmailAddress that is not splittable', () => {
            it('should return LdapEmailAddressError', async () => {
                personRepoMock.findById.mockResolvedValueOnce(person);

                const result: Result<PersonID> = await ldapClientService.changeEmailAddressByPersonId(
                    faker.string.uuid(),
                    'user-at-wrong-email-domain.de',
                );

                if (result.ok) throw Error();

                expect(result.error).toBeInstanceOf(LdapEmailAddressError);
            });
        });

        describe('when person cannot be found by personID', () => {
            it('should return LdapSearchError', async () => {
                personRepoMock.findById.mockResolvedValueOnce(person);
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
            const fakePersonID: string = faker.string.uuid();
            const fakeDN: string = faker.string.alpha();
            const newEmailAddress: string = 'new-address@schule-sh.de';
            const currentEmailAddress: string = 'current-address@schule-sh.de';

            it('should set mailAlternativeAddress as current mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                personRepoMock.findById.mockResolvedValueOnce(person);

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
                    newEmailAddress,
                );

                if (result.ok) throw Error();
                expect(result.error).toStrictEqual(new LdapModifyEmailError());
                expect(loggerMock.error).toHaveBeenLastCalledWith(
                    `LDAP: Modifying mailPrimaryAddress and mailAlternativeAddress FAILED, errMsg:{}`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });

        describe('when person can be found and modified', () => {
            let fakePersonID: string;
            let fakeDN: string;
            let newEmailAddress: string;
            let currentEmailAddress: string;

            beforeEach(() => {
                fakePersonID = faker.string.uuid();
                fakeDN = faker.string.alpha();
                newEmailAddress = 'new-address@schule-sh.de';
                currentEmailAddress = 'current-address@schule-sh.de';
            });

            describe('and already has a mailPrimaryAddress', () => {
                it('should set mailAlternativeAddress as current mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                    personRepoMock.findById.mockResolvedValueOnce(person);

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
                        newEmailAddress,
                    );

                    expect(result.ok).toBeTruthy();
                    expect(loggerMock.info).toHaveBeenLastCalledWith(
                        `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${fakePersonID}`,
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
                beforeEach(() => {
                    fakePersonID = faker.string.uuid();
                    fakeDN = faker.string.alpha();
                    newEmailAddress = 'new-address@schule-sh.de';
                    currentEmailAddress = 'current-address@schule-sh.de';
                });

                describe('and already has a mailPrimaryAddress', () => {
                    it('should set mailAlternativeAddress as current mailPrimaryAddress and throw LdapPersonEntryChangedEvent', async () => {
                        personRepoMock.findById.mockResolvedValueOnce(person);

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
                            newEmailAddress,
                        );

                        expect(result.ok).toBeTruthy();
                        expect(loggerMock.info).toHaveBeenLastCalledWith(
                            `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${fakePersonID}`,
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
                    personRepoMock.findById.mockResolvedValueOnce(person);

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
                        newEmailAddress,
                    );

                    expect(result.ok).toBeTruthy();
                    expect(loggerMock.info).toHaveBeenLastCalledWith(
                        `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${fakePersonID}`,
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
        const fakeGroupDn: string = `cn=${fakeGroupId},dc=schule-sh,dc=de`;
        const fakeLehrerUid: string = `uid=${fakePersonUid},ou=users,dc=schule-sh,dc=de`;
        const fakeDienstStellenNummer: string = '123';

        it('should successfully remove person from group with multiple members', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockResolvedValueOnce();
                clientMock.search.mockResolvedValueOnce(
                    createMock<SearchResult>({
                        searchEntries: [
                            createMock<Entry>({
                                dn: fakeGroupDn,
                                uniqueMember: [`${fakeLehrerUid}`, 'uid=otherUser,ou=users,dc=schule-sh,dc=de'],
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
            );

            expect(result.ok).toBeTruthy();
            expect(clientMock.modify).toHaveBeenCalledWith(fakeGroupDn, [
                new Change({
                    operation: 'delete',
                    modification: new Attribute({
                        type: 'uniqueMember',
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
                                uniqueMember: `${fakeLehrerUid}`,
                            }),
                        ],
                    }),
                );
                clientMock.del.mockResolvedValueOnce();

                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
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

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
            );

            expect(result.ok).toBeFalsy();
            if (result.ok) {
                throw Error();
            }
            expect(result.error).toBeInstanceOf(Error);
            expect(result.error.message).toContain(`LDAP: Group ${fakeGroupId} not found`);
            expect(loggerMock.error).toHaveBeenCalledWith(`LDAP: Group ${fakeGroupId} not found`);
        });

        it('should return error when bind fails', async () => {
            ldapClientMock.getClient.mockImplementation(() => {
                clientMock.bind.mockRejectedValueOnce(new Error());
                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
            );

            expect(result.ok).toBeFalsy();
            if (result.ok) {
                throw Error();
            }
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
                                uniqueMember: [`${fakeLehrerUid}`, 'uid=otherUser,ou=users,dc=schule-sh,dc=de'],
                            }),
                        ],
                    }),
                );
                clientMock.modify.mockRejectedValueOnce(new Error('Modify error'));

                return clientMock;
            });

            const result: Result<boolean, Error> = await ldapClientService.removePersonFromGroup(
                fakePersonUid,
                fakeDienstStellenNummer,
            );

            expect(result.ok).toBeFalsy();
            if (result.ok) {
                throw Error();
            }
            expect(result.error).toBeInstanceOf(LdapRemovePersonFromGroupError);
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LDAP: Failed to remove person from group ${fakeGroupId}, errMsg: Error: Modify error`,
            );
        });
    });
});

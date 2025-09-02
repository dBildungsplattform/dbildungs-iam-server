import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';

import { LdapModule } from '../ldap.module.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClientService, LdapPersonAttributes } from './ldap-client.service.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { OrganisationID, PersonID, PersonReferrer, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../../modules/person/domain/person.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.js';
import { EmailRepo } from '../../../modules/email/persistence/email.repo.js';
import { LdapSyncEventHandler } from './ldap-sync-event-handler.js';
import { EmailAddress, EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { LdapFetchAttributeError } from '../error/ldap-fetch-attribute.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { faker } from '@faker-js/faker';
import { DBiamPersonenkontextRepo } from '../../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { Personenkontext } from '../../../modules/personenkontext/domain/personenkontext.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { LdapSearchError } from '../error/ldap-search.error.js';
import { LdapEntityType } from './ldap.types.js';
import assert from 'assert';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { PersonLdapSyncEvent } from '../../../shared/events/person-ldap-sync.event.js';
import { EventRoutingLegacyKafkaService } from '../../eventbus/services/event-routing-legacy-kafka.service.js';
import { PersonIdentifier } from '../../logging/person-identifier.js';

describe('LdapSyncEventHandler', () => {
    const oeffentlicheSchulenDomain: string = 'schule-sh.de';

    let app: INestApplication;
    let orm: MikroORM;

    let sut: LdapSyncEventHandler;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let eventServiceMock: DeepMocked<EventRoutingLegacyKafkaService>;
    let loggerMock: DeepMocked<ClassLogger>;

    let personId: PersonID;
    let username: PersonReferrer;
    let event: PersonExternalSystemsSyncEvent;
    let vorname: string;
    let familienname: string;
    let person: Person<true>;
    let enabledEmailAddress: EmailAddress<true>;
    let email: string;
    let personAttributes: LdapPersonAttributes;
    let givenName: string;
    let surName: string;
    let cn: string;
    let mailPrimaryAddress: string;
    let mailAlternativeAddress: string;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
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
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(LdapClientService)
            .useValue(createMock<LdapClientService>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(OrganisationRepository)
            .useValue(createMock<OrganisationRepository>())
            .overrideProvider(EmailRepo)
            .useValue(createMock<EmailRepo>())
            .overrideProvider(EventRoutingLegacyKafkaService)
            .useValue(createMock<EventRoutingLegacyKafkaService>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        orm = module.get(MikroORM);

        loggerMock = module.get(ClassLogger);

        sut = module.get(LdapSyncEventHandler);
        ldapClientServiceMock = module.get(LdapClientService);
        personRepositoryMock = module.get(PersonRepository);
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        rolleRepoMock = module.get(RolleRepo);
        organisationRepositoryMock = module.get(OrganisationRepository);
        emailRepoMock = module.get(EmailRepo);
        eventServiceMock = module.get(EventRoutingLegacyKafkaService);
        loggerMock = module.get(ClassLogger);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    function getEmailAddress(personsId: PersonID, address: string, status: EmailAddressStatus): EmailAddress<true> {
        return EmailAddress.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            personsId,
            address,
            status,
            undefined,
        );
    }

    function getOrga(
        kennung: string = faker.string.numeric({ length: 7 }),
        typ: OrganisationsTyp = OrganisationsTyp.SCHULE,
    ): Organisation<true> {
        return createMock<Organisation<true>>({ id: faker.string.uuid(), kennung: kennung, typ: typ });
    }

    function getRolle(rollenart: RollenArt = RollenArt.LEHR): Rolle<true> {
        return createMock<Rolle<true>>({ id: faker.string.uuid(), rollenart: rollenart });
    }

    function getOrgaMap(...orgas: Organisation<true>[]): Map<OrganisationID, Organisation<true>> {
        const map: Map<OrganisationID, Organisation<true>> = new Map<OrganisationID, Organisation<true>>();
        orgas.map((orga: Organisation<true>) => map.set(orga.id, orga));
        return map;
    }

    function getRolleMap(...rollen: Rolle<true>[]): Map<RolleID, Rolle<true>> {
        const map: Map<RolleID, Rolle<true>> = new Map<RolleID, Rolle<true>>();
        rollen.map((rolle: Rolle<true>) => map.set(rolle.id, rolle));
        return map;
    }

    /**
     * Creates three PKs for given person, two with rollenArt LEHR and one with rollenArt LERN, every PK targets another fresh created organisation.
     * The returned result is 1. list of the PKs followed by orgaMap and then rolleMap.
     * All three different result values are used as result in mocked method calls (DbiamPersonenkontextRepo, OrganisationRepository and RolleRepo).
     * @param pkPerson
     */
    function getPkArrayOrgaMapAndRolleMap(
        pkPerson: Person<true>,
    ): [Personenkontext<true>[], Map<OrganisationID, Organisation<true>>, Map<RolleID, Rolle<true>>] {
        const lehrRolle1: Rolle<true> = getRolle();
        const lehrOrga1: Organisation<true> = getOrga();
        const lehrPk1: Personenkontext<true> = createMock<Personenkontext<true>>({
            id: faker.string.uuid(),
            organisationId: lehrOrga1.id,
            rolleId: lehrRolle1.id,
            personId: pkPerson.id,
        });
        const lehrRolle2: Rolle<true> = getRolle();
        const lehrOrga2: Organisation<true> = getOrga();
        const lehrPk2: Personenkontext<true> = createMock<Personenkontext<true>>({
            id: faker.string.uuid(),
            organisationId: lehrOrga2.id,
            rolleId: lehrRolle2.id,
            personId: pkPerson.id,
        });

        // used to cover filtering on RollenArt LEHR
        const lernRolle1: Rolle<true> = getRolle(RollenArt.LERN);
        const lernOrga1: Organisation<true> = getOrga();
        const lernPk1: Personenkontext<true> = createMock<Personenkontext<true>>({
            id: faker.string.uuid(),
            organisationId: lernOrga1.id,
            rolleId: lernRolle1.id,
            personId: pkPerson.id,
        });

        // used to cover filtering on OrganisationsTyp SCHULE
        const lehrRolleForPKOnKlasse: Rolle<true> = getRolle();
        const lehrOrgaForPkOnKlasse: Organisation<true> = getOrga(
            faker.string.numeric({ length: 7 }),
            OrganisationsTyp.KLASSE,
        );
        const lehrPKOnKlasse: Personenkontext<true> = createMock<Personenkontext<true>>({
            id: faker.string.uuid(),
            organisationId: lehrOrgaForPkOnKlasse.id,
            rolleId: lehrRolleForPKOnKlasse.id,
            personId: pkPerson.id,
        });

        const pk: Personenkontext<true>[] = [lehrPk1, lehrPk2, lernPk1, lehrPKOnKlasse];
        const orgaMap: Map<OrganisationID, Organisation<true>> = getOrgaMap(
            lehrOrga1,
            lehrOrga2,
            lernOrga1,
            lehrOrgaForPkOnKlasse,
        );
        const rolleMap: Map<RolleID, Rolle<true>> = getRolleMap(
            lehrRolle1,
            lehrRolle2,
            lernRolle1,
            lehrRolleForPKOnKlasse,
        );

        return [pk, orgaMap, rolleMap];
    }

    function mockPersonenKontextRelatedRepositoryCalls(
        kontexte: Personenkontext<true>[],
        orgaMap: Map<OrganisationID, Organisation<true>>,
        rolleMap: Map<RolleID, Rolle<true>>,
    ): void {
        dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(kontexte);
        organisationRepositoryMock.findByIds.mockResolvedValueOnce(orgaMap);
        rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
    }

    function mockPersonFoundEnabledAddressFoundDisabledAddressNotFound(): void {
        personRepositoryMock.findById.mockResolvedValueOnce(person);
        emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
        emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);
    }

    function mockPersonAttributesFoundGroupsNotFound(): void {
        ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
            ok: true,
            value: personAttributes,
        });
        ldapClientServiceMock.getGroupsForPerson.mockResolvedValueOnce({
            ok: true,
            value: [],
        });
    }

    function createDataFetchedByRepositoriesAndLDAP(): void {
        personId = faker.string.uuid();
        username = faker.internet.userName();
        event = new PersonExternalSystemsSyncEvent(personId);
        vorname = faker.person.firstName();
        familienname = faker.person.lastName();
        person = createMock<Person<true>>({
            id: personId,
            referrer: username,
            vorname: vorname,
            familienname: familienname,
        });
        email = faker.internet.email();
        enabledEmailAddress = createMock<EmailAddress<true>>({
            get address(): string {
                return email;
            },
        });
        givenName = faker.person.firstName();
        surName = faker.person.lastName();
        cn = faker.internet.userName();
        mailPrimaryAddress = faker.internet.email();
        mailAlternativeAddress = faker.internet.email();
        personAttributes = {
            entryUUID: undefined, // entryUUID is only set in LdapClientService when an empty PersonEntry had to be created
            dn: 'dn',
            givenName: givenName,
            surName: surName,
            cn: cn,
            mailPrimaryAddress: mailPrimaryAddress,
            mailAlternativeAddress: mailAlternativeAddress,
        };
    }

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);
    });

    //* This test case is just for coverage, all real test cases for syncing are handled in test for 'personExternalSystemSyncEventHandler */
    describe('triggerLdapSync', () => {
        beforeEach(() => {
            personId = faker.string.uuid();
            person = createMock<Person<true>>();
        });

        describe('when person CANNOT be found by events personID', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await sut.triggerLdapSync(personId);

                expect(emailRepoMock.findEnabledByPerson).toHaveBeenCalledTimes(0);
                expect(loggerMock.error).toHaveBeenCalledWith(`Person with personId:${personId} could not be found!`);
            });
        });
    });

    //* This test case is just for coverage, all real test cases for syncing are handled in test for 'personExternalSystemSyncEventHandler */
    describe('personLdapSyncEventHandler', () => {
        beforeEach(() => {
            personId = faker.string.uuid();
            event = new PersonLdapSyncEvent(personId);
            person = createMock<Person<true>>();
        });

        describe('when person CANNOT be found by events personID', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await sut.personLdapSyncEventHandler(event);

                expect(emailRepoMock.findEnabledByPerson).toHaveBeenCalledTimes(0);
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Received PersonLdapSyncEvent, personId:${event.personId}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Person with personId:${event.personId} could not be found!`,
                );
            });
        });
    });

    describe('personExternalSystemSyncEventHandler', () => {
        let personInfo: PersonIdentifier;
        beforeEach(() => {
            personId = faker.string.uuid();
            username = faker.internet.userName();
            event = new PersonExternalSystemsSyncEvent(personId);
            person = createMock<Person<true>>({ referrer: username });
            email = faker.internet.email();
            enabledEmailAddress = createMock<EmailAddress<true>>({
                get address(): string {
                    return email;
                },
            });
            personInfo = {
                personId: personId,
                username: username,
            };
        });

        describe('when person CANNOT be found by events personID', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await sut.personExternalSystemSyncEventHandler(event);

                expect(emailRepoMock.findEnabledByPerson).toHaveBeenCalledTimes(0);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Person with personId:${event.personId} could not be found!`,
                );
            });
        });

        describe('when person has NO username', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>({ referrer: undefined }));

                await sut.personExternalSystemSyncEventHandler(event);

                expect(emailRepoMock.findEnabledByPerson).toHaveBeenCalledTimes(0);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Person with personId:${event.personId} has no username!`,
                );
            });
        });

        describe('when person has NO enabled/active email-address', () => {
            it('should log error, return without proceeding and publish LdapSyncFailedEvent', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(undefined);

                await sut.personExternalSystemSyncEventHandler(event);

                expect(eventServiceMock.publish).toHaveBeenCalledWith(
                    expect.objectContaining({
                        personId: personId,
                        username: username,
                    }),
                    expect.objectContaining({
                        personId: personId,
                        username: username,
                    }),
                );
                expect(loggerMock.warningPersonalized).toHaveBeenCalledWith(
                    `Could not find ENABLED EmailAddress, searching for FAILED EmailAddress`,
                    personInfo,
                );
            });

            describe('and not any FAILED EmailAddress could be found', () => {
                it('should log error, return without proceeding and publish LdapSyncFailedEvent', async () => {
                    personRepositoryMock.findById.mockResolvedValueOnce(person);
                    //mock search for ENABLED EmailAddress
                    emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(undefined);
                    //mock search for FAILED EmailAddresses
                    emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
                    expect(loggerMock.errorPersonalized).toHaveBeenCalledWith(
                        `Could not find any FAILED EmailAddress after no ENABLED EmaiLAddress could be found, ABORTING LDAP-Sync`,
                        personInfo,
                    );
                });
            });

            describe('and FAILED EmailAddress is found but already has an oxUserId', () => {
                it('should log error, return without proceeding and publish LdapSyncFailedEvent', async () => {
                    personRepositoryMock.findById.mockResolvedValueOnce(person);
                    //mock search for ENABLED EmailAddress
                    emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(undefined);
                    //mock search for FAILED EmailAddresses
                    const failedEmailAddress: EmailAddress<true> = createMock<EmailAddress<true>>({
                        get address(): string {
                            return email;
                        },
                        get status(): EmailAddressStatus {
                            return EmailAddressStatus.FAILED;
                        },
                        get oxUserID(): string {
                            return faker.string.numeric();
                        },
                    });
                    emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([failedEmailAddress]);

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
                    expect(loggerMock.errorPersonalized).toHaveBeenCalledWith(
                        `Most recent FAILED EmailAddress already has an oxUserId, ABORTING LDAP-Sync`,
                        personInfo,
                    );
                });
            });
        });

        describe('when no DISABLED email-addresses can be found for person', () => {
            it('should log info and proceed', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);

                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: createMock<LdapPersonAttributes>(),
                });

                ldapClientServiceMock.getGroupsForPerson.mockResolvedValueOnce({
                    ok: true,
                    value: [],
                });

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `No DISABLED EmailAddress(es) for Person with ID ${event.personId}`,
                );
            });
        });

        describe('when fetching person-attributes in LDAP fails', () => {
            it('should log error and return', async () => {
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);

                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                const error: LdapFetchAttributeError = new LdapFetchAttributeError(personId, username, 'attribute');
                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: false,
                    error: error,
                });

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Error while fetching attributes for personId:${personId} in LDAP, msg:${error.message}`,
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
            });
        });

        describe('when fetching groups in LDAP for person fails', () => {
            it('should log error and return', async () => {
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);

                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );
                personAttributes = {
                    entryUUID: undefined, // entryUUID is only set in LdapClientService when an empty PersonEntry had to be created
                    dn: 'dn',
                };
                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: personAttributes,
                });

                ldapClientServiceMock.getGroupsForPerson.mockResolvedValueOnce({
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                });

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while fetching groups for personId'),
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
            });
        });

        describe('when at least one organisation CANNOT be found in orgaMap', () => {
            it('should log error and return', async () => {
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                // hence kontexte are filtered by organisations.has, removing one organisation from map here, would not create a coverage case
                // therefore a mocked map is used
                const mockedMap: DeepMocked<Map<OrganisationID, Organisation<true>>> =
                    createMock<Map<OrganisationID, Organisation<true>>>();
                mockedMap.entries.mockImplementationOnce(() => {
                    return orgaMap.entries();
                });
                mockedMap.has.mockImplementationOnce((id: string) => {
                    return orgaMap.has(id);
                });
                mockedMap.get.mockImplementationOnce(() => {
                    return undefined;
                });
                mockPersonenKontextRelatedRepositoryCalls(kontexte, mockedMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining(`Could not find organisation`));
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
            });
        });

        describe('when at least one organisation does NOT have a kennung', () => {
            it('should log error and return', async () => {
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                // set kennung for an organisation undefined to force 'Required kennung is missing on organisation'
                assert(kontexte[0]);
                const orgaWithoutKennung: Organisation<true> | undefined = orgaMap.get(kontexte[0].organisationId);
                if (!orgaWithoutKennung) throw Error();
                orgaWithoutKennung.kennung = undefined;
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining(`Required kennung is missing on organisation`),
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
            });
        });

        describe('when organisationIds CANNOT be found, no PKs exist', () => {
            it('should log error and return without syncing', async () => {
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();
                mockPersonenKontextRelatedRepositoryCalls(
                    [],
                    new Map<OrganisationID, Organisation<true>>(),
                    new Map<RolleID, Rolle<true>>(),
                );

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could NOT fetch domain from organisations, no organisations found for person, ABORTING SYNC, personId:${personId}`,
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
            });
        });

        describe('when emailDomain CANNOT be found in organisation tree recursively', () => {
            it('should log error and return without syncing', async () => {
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                // set kennung for an organisation undefined to force 'Required kennung is missing on organisation'
                assert(kontexte[0]);
                const orgaWithoutKennung: Organisation<true> | undefined = orgaMap.get(kontexte[0].organisationId);
                if (!orgaWithoutKennung) throw Error();
                orgaWithoutKennung.kennung = undefined;
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(undefined);

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining(
                        `Could NOT fetch domain from organisations, LDAP-root CANNOT be chosen, ABORTING SYNC, personId:${personId}`,
                    ),
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
            });
        });
    });

    //* syncDataToLdap is tested via calling personExternalSystemSyncEventHandler */
    describe('syncDataToLdap', () => {
        beforeEach(() => {
            createDataFetchedByRepositoriesAndLDAP();
        });

        describe('when vorname and givenName, familienname and surName, username and cn DO NOT match', () => {
            it('should log info', async () => {
                //mock: email-addresses are equal -> no processing for mismatching emails necessary
                enabledEmailAddress = createMock<EmailAddress<true>>({
                    get address(): string {
                        return mailPrimaryAddress;
                    },
                });
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                mockPersonAttributesFoundGroupsNotFound();

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Mismatch for givenName, person:${person.vorname}, LDAP:${givenName}, personId:${personId}, username:${username}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Mismatch for surName, person:${person.familienname}, LDAP:${surName}, personId:${personId}, username:${username}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Mismatch for cn, person:${person.referrer}, LDAP:${cn}, personId:${personId}, username:${username}`,
                );
            });
        });

        describe('when enabled EmailAddress and mailPrimaryAddress DO NOT match', () => {
            describe('and mailPrimaryAddress is undefined', () => {
                it('should log warning and change mailPrimaryAddress in LDAP', async () => {
                    //mock mailPrimaryAddress found in LDAP is undefined;
                    personAttributes.mailPrimaryAddress = undefined;
                    mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                    // create PKs, orgaMap and rolleMap
                    const [kontexte, orgaMap, rolleMap]: [
                        Personenkontext<true>[],
                        Map<OrganisationID, Organisation<true>>,
                        Map<RolleID, Rolle<true>>,
                    ] = getPkArrayOrgaMapAndRolleMap(person);
                    mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                    organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                        oeffentlicheSchulenDomain,
                    );

                    mockPersonAttributesFoundGroupsNotFound();

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Syncing data to LDAP for personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Mismatch mailPrimaryAddress, person:${email}, LDAP:undefined, personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `MailPrimaryAddress undefined for personId:${personId}, username:${username}`,
                    );
                    expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledWith(
                        personId,
                        username,
                        email,
                    );
                });
            });

            describe('and mailPrimaryAddress CANNOT be found in disabled EmailAddresses', () => {
                it('should log critical and abort sync', async () => {
                    mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                    // create PKs, orgaMap and rolleMap
                    const [kontexte, orgaMap, rolleMap]: [
                        Personenkontext<true>[],
                        Map<OrganisationID, Organisation<true>>,
                        Map<RolleID, Rolle<true>>,
                    ] = getPkArrayOrgaMapAndRolleMap(person);
                    mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                    organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                        oeffentlicheSchulenDomain,
                    );

                    mockPersonAttributesFoundGroupsNotFound();

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Syncing data to LDAP for personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Mismatch mailPrimaryAddress, person:${email}, LDAP:${mailPrimaryAddress}, personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.crit).toHaveBeenCalledWith(
                        `COULD NOT find ${mailPrimaryAddress} in DISABLED addresses, Overwriting ABORTED, personId:${personId}, username:${username}`,
                    );
                    expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledTimes(0);
                });
            });

            describe('and mailPrimaryAddress can be found in disabled EmailAddresses', () => {
                it('should log info, change mailPrimaryAddress in LDAP', async () => {
                    personRepositoryMock.findById.mockResolvedValueOnce(person);
                    emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                    emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                        createMock<EmailAddress<true>>({
                            get address(): string {
                                return mailPrimaryAddress;
                            },
                            get status(): EmailAddressStatus {
                                return EmailAddressStatus.DISABLED;
                            },
                        }),
                    ]);

                    // create PKs, orgaMap and rolleMap
                    const [kontexte, orgaMap, rolleMap]: [
                        Personenkontext<true>[],
                        Map<OrganisationID, Organisation<true>>,
                        Map<RolleID, Rolle<true>>,
                    ] = getPkArrayOrgaMapAndRolleMap(person);
                    mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                    organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                        oeffentlicheSchulenDomain,
                    );

                    mockPersonAttributesFoundGroupsNotFound();

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Syncing data to LDAP for personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Mismatch mailPrimaryAddress, person:${email}, LDAP:${mailPrimaryAddress}, personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Found ${mailPrimaryAddress} in DISABLED addresses, personId:${personId}, username:${username}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Overwriting LDAP:${mailPrimaryAddress} with person:${email}, personId:${personId}, username:${username}`,
                    );
                    expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledWith(
                        personId,
                        username,
                        email,
                    );
                });
            });
        });

        describe('when a member-relation is missing, an orphan member-relation exists and a corrupt group-dn exists', () => {
            const rolle1: Rolle<true> = getRolle();
            const orga1Kennung: string = faker.string.numeric({ length: 7 });
            const orga1: Organisation<true> = getOrga(orga1Kennung);
            const pk1: Personenkontext<true> = createMock<Personenkontext<true>>({
                id: faker.string.uuid(),
                organisationId: orga1.id,
                rolleId: rolle1.id,
                personId: personId,
            });

            const pks: Personenkontext<true>[] = [pk1];
            const orgaMap: Map<OrganisationID, Organisation<true>> = getOrgaMap(orga1);
            const rolleMap: Map<RolleID, Rolle<true>> = getRolleMap(rolle1);

            it('should log warnings regarding LDAP-groups, corrupt group-dn, add missing member-relationship and remove orphan member-relationship', async () => {
                //mock: email-addresses are equal -> no processing for mismatching emails necessary
                enabledEmailAddress = createMock<EmailAddress<true>>({
                    get address(): string {
                        return mailPrimaryAddress;
                    },
                });
                mockPersonFoundEnabledAddressFoundDisabledAddressNotFound();

                mockPersonenKontextRelatedRepositoryCalls(pks, orgaMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: personAttributes,
                });

                const groupWithoutPkKennung: string = faker.string.numeric({ length: 7 });
                const groupWithoutPkDn: string = `cn=lehrer-${groupWithoutPkKennung},cn=groups,ou=${groupWithoutPkKennung},dc=schule-sh,dc=de`;
                const corruptGroupDn1: string = `cn=topanga-${groupWithoutPkKennung},cn=is,ou=${groupWithoutPkKennung},dc=hot,dc=tonight`;
                const corruptGroupDn2: string = `cn=these-${groupWithoutPkKennung},cn=groups,ou=${groupWithoutPkKennung},dc=are,dc=crazy`;
                //mock: LDAP-group for existing PK (orga1Kennung) is NOT found, but an LDAP-group for non-existing PK and a corrupt group-dn are found
                ldapClientServiceMock.getGroupsForPerson.mockResolvedValueOnce({
                    ok: true,
                    value: [groupWithoutPkDn, corruptGroupDn1, corruptGroupDn2],
                });

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, username:${username}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Added missing groupMembership for kennung:${orga1Kennung}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Orphan group detected, no existing PK for groupDN:${groupWithoutPkDn}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Split on ,cn=groups, failed'));
            });
        });
    });

    //* createDisabledEmailAddress is tested via calling personExternalSystemSyncEventHandler and syncDataToLdap */
    describe('createDisabledEmailAddress', () => {
        beforeEach(() => {
            createDataFetchedByRepositoriesAndLDAP();
        });

        describe('when persisting new DISABLED EmailAddress fails', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>({
                        get address(): string {
                            return mailPrimaryAddress;
                        },
                        get status(): EmailAddressStatus {
                            return EmailAddressStatus.DISABLED;
                        },
                    }),
                ]);

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                mockPersonAttributesFoundGroupsNotFound();

                emailRepoMock.save.mockResolvedValueOnce(new EntityCouldNotBeCreated('EmailAddress'));

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not persist email for personId:${personId}, username:${username}, error:EmailAddress could not be created`,
                );
            });
        });

        describe('when persisting new DISABLED EmailAddress succeeds', () => {
            it('should log info', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>({
                        get address(): string {
                            return mailPrimaryAddress;
                        },
                        get status(): EmailAddressStatus {
                            return EmailAddressStatus.DISABLED;
                        },
                    }),
                ]);

                // create PKs, orgaMap and rolleMap
                const [kontexte, orgaMap, rolleMap]: [
                    Personenkontext<true>[],
                    Map<OrganisationID, Organisation<true>>,
                    Map<RolleID, Rolle<true>>,
                ] = getPkArrayOrgaMapAndRolleMap(person);
                mockPersonenKontextRelatedRepositoryCalls(kontexte, orgaMap, rolleMap);
                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(
                    oeffentlicheSchulenDomain,
                );

                mockPersonAttributesFoundGroupsNotFound();

                emailRepoMock.save.mockResolvedValueOnce(
                    getEmailAddress(personId, mailAlternativeAddress, EmailAddressStatus.DISABLED),
                );

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully persisted new DISABLED EmailAddress for address:${mailAlternativeAddress}, personId:${personId}, username:${username}`,
                );
            });
        });
    });
});

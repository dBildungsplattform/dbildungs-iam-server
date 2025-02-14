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
import { PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../../modules/person/domain/person.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.js';
import { EmailRepo } from '../../../modules/email/persistence/email.repo.js';
import { LdapSyncEventHandler } from './ldap-sync-event-handler.js';
import { EmailAddress, EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { LdapFetchAttributeError } from '../error/ldap-fetch-attribute.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { faker } from '@faker-js/faker';

describe('LdapSyncEventHandler', () => {
    let app: INestApplication;
    let orm: MikroORM;

    let sut: LdapSyncEventHandler;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let loggerMock: DeepMocked<ClassLogger>;

    let personId: PersonID;
    let referrer: PersonReferrer;
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
            .overrideProvider(OrganisationRepository)
            .useValue(createMock<OrganisationRepository>())
            .overrideProvider(EmailRepo)
            .useValue(createMock<EmailRepo>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        orm = module.get(MikroORM);

        loggerMock = module.get(ClassLogger);

        sut = module.get(LdapSyncEventHandler);
        ldapClientServiceMock = module.get(LdapClientService);
        personRepositoryMock = module.get(PersonRepository);
        emailRepoMock = module.get(EmailRepo);
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

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('personExternalSystemSyncEventHandler', () => {
        beforeEach(() => {
            personId = faker.string.uuid();
            referrer = faker.internet.userName();
            event = new PersonExternalSystemsSyncEvent(personId);
            person = createMock<Person<true>>();
            email = faker.internet.email();
            enabledEmailAddress = createMock<EmailAddress<true>>({
                get address(): string {
                    return email;
                },
            });
        });

        describe('when person CANNOT be found by events personID', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await sut.personExternalSystemSyncEventHandler(event);

                expect(emailRepoMock.findEnabledByPerson).toHaveBeenCalledTimes(0);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Person with ID ${event.personId} could not be found!`,
                );
            });
        });

        describe('when person has NO username', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>({ referrer: undefined }));

                await sut.personExternalSystemSyncEventHandler(event);

                expect(emailRepoMock.findEnabledByPerson).toHaveBeenCalledTimes(0);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Person with ID ${event.personId} has no username!`,
                );
            });
        });

        describe('when person has NO enabled/active email-address', () => {
            it('should log error and return without proceeding', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(undefined);

                await sut.personExternalSystemSyncEventHandler(event);

                expect(emailRepoMock.findByPersonSortedByUpdatedAtDesc).toHaveBeenCalledTimes(0);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Person with ID ${event.personId} has no enabled EmailAddress!`,
                );
            });
        });

        describe('when no DISABLED email-addresses can be found for person', () => {
            it('should log info and proceed', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] No DISABLED EmailAddress(es) for Person with ID ${event.personId}`,
                );
            });
        });

        describe('when no fetching person-attributes in LDAP fails', () => {
            it('should log error and return', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);
                const error: LdapFetchAttributeError = new LdapFetchAttributeError(personId, referrer, 'attribute');
                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: false,
                    error: error,
                });

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Error while fetching attributes for person in LDAP, msg:${error.message}`,
                );
                expect(loggerMock.info).not.toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, referrer:${referrer}`,
                );
            });
        });
    });

    //* syncDataToLdap is tested via calling personExternalSystemSyncEventHandler */
    describe('syncDataToLdap', () => {
        beforeEach(() => {
            personId = faker.string.uuid();
            referrer = faker.internet.userName();
            event = new PersonExternalSystemsSyncEvent(personId);
            vorname = faker.person.firstName();
            familienname = faker.person.lastName();
            person = createMock<Person<true>>({
                id: personId,
                referrer: referrer,
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
                givenName: givenName,
                surName: surName,
                cn: cn,
                mailPrimaryAddress: mailPrimaryAddress,
                mailAlternativeAddress: mailAlternativeAddress,
            };
        });

        describe('when vorname and givenName, familienname and surName, referrer and cn DO NOT match', () => {
            it('should log info', async () => {
                //mock: email-addresses are equal -> no processing for mismatching emails necessary
                enabledEmailAddress = createMock<EmailAddress<true>>({
                    get address(): string {
                        return mailPrimaryAddress;
                    },
                });
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);
                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: personAttributes,
                });

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Syncing data to LDAP for personId:${personId}, referrer:${referrer}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Mismatch for givenName, person:${person.vorname}, LDAP:${givenName}, personId:${personId}, referrer:${referrer}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Mismatch for surName, person:${person.familienname}, LDAP:${surName}, personId:${personId}, referrer:${referrer}`,
                );
                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Mismatch for cn, person:${person.referrer}, LDAP:${cn}, personId:${personId}, referrer:${referrer}`,
                );
            });
        });

        describe('when enabled EmailAddress and mailPrimaryAddress DO NOT match', () => {
            describe('and mailPrimaryAddress is undefined', () => {
                it('should log warning and change mailPrimaryAddress in LDAP', async () => {
                    //mock mailPrimaryAddress found in LDAP is undefined;
                    personAttributes.mailPrimaryAddress = undefined;
                    personRepositoryMock.findById.mockResolvedValueOnce(person);
                    emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                    emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);
                    ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                        ok: true,
                        value: personAttributes,
                    });

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Syncing data to LDAP for personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Mismatch mailPrimaryAddress, person:${email}, LDAP:undefined, personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `MailPrimaryAddress undefined for personId:${personId}, referrer:${referrer}`,
                    );
                    expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledWith(
                        personId,
                        referrer,
                        email,
                    );
                });
            });

            describe('and mailPrimaryAddress CANNOT be found in disabled EmailAddresses', () => {
                it('should log critical and abort sync', async () => {
                    personRepositoryMock.findById.mockResolvedValueOnce(person);
                    emailRepoMock.findEnabledByPerson.mockResolvedValueOnce(enabledEmailAddress);
                    emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);
                    ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                        ok: true,
                        value: personAttributes,
                    });

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Syncing data to LDAP for personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Mismatch mailPrimaryAddress, person:${email}, LDAP:${mailPrimaryAddress}, personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.crit).toHaveBeenCalledWith(
                        `COULD NOT find ${mailPrimaryAddress} in DISABLED addresses, Overwriting ABORTED, personId:${personId}, referrer:${referrer}`,
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
                    ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                        ok: true,
                        value: personAttributes,
                    });

                    await sut.personExternalSystemSyncEventHandler(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Syncing data to LDAP for personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.warning).toHaveBeenCalledWith(
                        `Mismatch mailPrimaryAddress, person:${email}, LDAP:${mailPrimaryAddress}, personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Found ${mailPrimaryAddress} in DISABLED addresses, personId:${personId}, referrer:${referrer}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Overwriting LDAP:${mailPrimaryAddress} with person:${email}, personId:${personId}, referrer:${referrer}`,
                    );
                    expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledWith(
                        personId,
                        referrer,
                        email,
                    );
                });
            });
        });
    });

    //* createDisabledEmailAddress is tested via calling personExternalSystemSyncEventHandler and syncDataToLdap */
    describe('createDisabledEmailAddress', () => {
        beforeEach(() => {
            personId = faker.string.uuid();
            referrer = faker.internet.userName();
            event = new PersonExternalSystemsSyncEvent(personId);
            vorname = faker.person.firstName();
            familienname = faker.person.lastName();
            person = createMock<Person<true>>({
                id: personId,
                referrer: referrer,
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
                givenName: givenName,
                surName: surName,
                cn: cn,
                mailPrimaryAddress: mailPrimaryAddress,
                mailAlternativeAddress: mailAlternativeAddress,
            };
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
                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: personAttributes,
                });
                emailRepoMock.save.mockResolvedValueOnce(new EntityCouldNotBeCreated('EmailAddress'));

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not persist email for personId:${personId}, referrer:${referrer}, error:EmailAddress could not be created`,
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
                ldapClientServiceMock.getPersonAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: personAttributes,
                });
                emailRepoMock.save.mockResolvedValueOnce(
                    getEmailAddress(personId, mailAlternativeAddress, EmailAddressStatus.DISABLED),
                );

                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully persisted new DISABLED EmailAddress for address:${mailAlternativeAddress}, personId:${personId}, referrer:${referrer}`,
                );
            });
        });
    });
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EventModule, EventService } from '../../../core/eventbus/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonID, PersonReferrer } from '../../../shared/types/index.js';
import { EmailAddressDeletionModule } from './email-address-deletion.module.js';
import { EmailAddressDeletionHandler } from './email-address-deletion-handler.js';
import { LdapEmailAddressDeletedEvent } from '../../../shared/events/ldap-email-address-deleted.event.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { EmailAddressDeletionError } from '../error/email-address-deletion.error.js';
import { OxEmailAddressDeletedEvent } from '../../../shared/events/ox-email-address-deleted.event.js';
import { OXContextID, OXContextName, OXUserID } from '../../../shared/types/ox-ids.types.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';

/**
 * Returns a new EmailAddress with random createdAt and updatedAt attributes, sets personId, address and status
 * accordingly to parameter values.
 * @param personId
 * @param address
 * @param status
 */
function getEmailAddress(personId: PersonID, address: string, status: EmailAddressStatus): EmailAddress<true> {
    const fakeEmailAddressId: string = faker.string.uuid();
    return EmailAddress.construct(
        fakeEmailAddressId,
        faker.date.past(),
        faker.date.recent(),
        personId,
        address,
        status,
    );
}

describe('EmailAddressDeletionHandler', () => {
    let app: INestApplication;
    let sut: EmailAddressDeletionHandler;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                EmailAddressDeletionModule,
                EventModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [],
        })
            .overrideProvider(EmailRepo)
            .useValue(createMock<EmailRepo>())
            .overrideProvider(EmailAddressDeletionHandler)
            .useClass(EmailAddressDeletionHandler)
            .overrideProvider(EventService)
            .useValue(createMock<EventService>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        sut = module.get(EmailAddressDeletionHandler);
        emailRepoMock = module.get(EmailRepo);
        loggerMock = module.get(ClassLogger);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    function expectReceivedEventLogAndStatusChangeLog(
        event: LdapEmailAddressDeletedEvent | OxEmailAddressDeletedEvent,
        status: EmailAddressStatus,
    ): void {
        if (event instanceof LdapEmailAddressDeletedEvent) {
            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received LdapEmailAddressDeletedEvent, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
            );
        } else {
            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received OxEmailAddressDeletedEvent, personId:${event.personId}, referrer:${event.username}, oxUserId:${event.oxUserId}, address:${event.address}`,
            );
        }
        expect(loggerMock.info).toHaveBeenCalledWith(
            `New EmailAddressStatus is:${status}, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
        );
    }

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('handleLdapEmailAddressDeletedEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const username: PersonReferrer = faker.internet.userName();
        const address: string = faker.internet.email();
        const event: LdapEmailAddressDeletedEvent = new LdapEmailAddressDeletedEvent(personId, username, address);
        let emailAddress: EmailAddress<true>;

        describe('when EmailAddress CANNOT be found by address', () => {
            it('should log error about that', async () => {
                emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DISABLED);
                emailRepoMock.findByAddress.mockResolvedValueOnce(undefined);

                await sut.handleLdapEmailAddressDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Received LdapEmailAddressDeletedEvent, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not process LdapEmailAddressDeletedEvent, EmailAddress could not be fetched by address, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
                );
            });
        });

        describe('when EmailAddress is found by address', () => {
            describe('when status change results in DELETED_LDAP', () => {
                describe('persisting changed status fails', () => {
                    it('should log error', async () => {
                        emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DISABLED);
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.save.mockResolvedValueOnce(new EmailAddressNotFoundError()); //mock: an Error is returned

                        await sut.handleLdapEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED_LDAP);
                        expect(loggerMock.error).toHaveBeenCalledWith(
                            `Failed persisting changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.save).toHaveBeenCalledTimes(1);
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(0);
                    });
                });

                describe('persisting changed status succeeds', () => {
                    it('should log info', async () => {
                        emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DISABLED);
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.save.mockResolvedValueOnce(emailAddress); //mock: no Error is returned

                        await sut.handleLdapEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED_LDAP);
                        expect(loggerMock.info).toHaveBeenCalledWith(
                            `Successfully persisted changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.save).toHaveBeenCalledTimes(1);
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(0);
                    });
                });
            });

            describe('when status was DELETED_OX and change results in DELETED', () => {
                beforeEach(() => {
                    emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DELETED_OX);
                });

                describe('when deletion in DB fails', () => {
                    it('should log error about that', async () => {
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.deleteById.mockResolvedValueOnce(new EmailAddressDeletionError(emailAddress.id));
                        await sut.handleLdapEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED);
                        expect(loggerMock.error).toHaveBeenCalledWith(
                            `Deletion of EmailAddress failed, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(1);
                    });
                });

                describe('when deletion in DB succeeds', () => {
                    it('should log info', async () => {
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.deleteById.mockResolvedValueOnce(undefined);
                        await sut.handleLdapEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED);
                        expect(loggerMock.info).toHaveBeenCalledWith(
                            `Successfully deleted EmailAddress, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(1);
                    });
                });
            });
        });
    });

    describe('handleOxEmailAddressDeletedEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const oxUserId: OXUserID = faker.string.uuid();
        const username: PersonReferrer = faker.internet.userName();
        const address: string = faker.internet.email();
        const oxContextId: OXContextID = '10';
        const oxContextName: OXContextName = 'testContext';
        const event: OxEmailAddressDeletedEvent = new OxEmailAddressDeletedEvent(
            personId,
            oxUserId,
            username,
            address,
            oxContextId,
            oxContextName,
        );
        let emailAddress: EmailAddress<true>;

        describe('when EmailAddress CANNOT be found by address', () => {
            it('should log error about that', async () => {
                emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DISABLED);
                emailRepoMock.findByAddress.mockResolvedValueOnce(undefined);

                await sut.handleOxEmailAddressDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Received OxEmailAddressDeletedEvent, personId:${event.personId}, referrer:${event.username}, oxUserId:${event.oxUserId}, address:${event.address}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not process OxEmailAddressDeletedEvent, EmailAddress could not be fetched by address, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
                );
            });
        });

        describe('when EmailAddress is found by address', () => {
            describe('when status change results in DELETED_OX', () => {
                describe('persisting changed status fails', () => {
                    it('should log error', async () => {
                        emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DISABLED);
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.save.mockResolvedValueOnce(new EmailAddressNotFoundError()); //mock: an Error is returned

                        await sut.handleOxEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED_OX);
                        expect(loggerMock.error).toHaveBeenCalledWith(
                            `Failed persisting changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.save).toHaveBeenCalledTimes(1);
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(0);
                    });
                });

                describe('persisting changed status succeeds', () => {
                    it('should log info', async () => {
                        emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DISABLED);
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.save.mockResolvedValueOnce(emailAddress); //mock: no Error is returned

                        await sut.handleOxEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED_OX);
                        expect(loggerMock.info).toHaveBeenCalledWith(
                            `Successfully persisted changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.save).toHaveBeenCalledTimes(1);
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(0);
                    });
                });
            });

            describe('when status was DELETED_LDAP and change results in DELETED', () => {
                beforeEach(() => {
                    emailAddress = getEmailAddress(personId, address, EmailAddressStatus.DELETED_LDAP);
                });

                describe('when deletion in DB fails', () => {
                    it('should log error about that', async () => {
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.deleteById.mockResolvedValueOnce(new EmailAddressDeletionError(emailAddress.id));
                        await sut.handleOxEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED);
                        expect(loggerMock.error).toHaveBeenCalledWith(
                            `Deletion of EmailAddress failed, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(1);
                    });
                });

                describe('when deletion in DB succeeds', () => {
                    it('should log info', async () => {
                        emailRepoMock.findByAddress.mockResolvedValueOnce(emailAddress);
                        emailRepoMock.deleteById.mockResolvedValueOnce(undefined);
                        await sut.handleOxEmailAddressDeletedEvent(event);

                        expectReceivedEventLogAndStatusChangeLog(event, EmailAddressStatus.DELETED);
                        expect(loggerMock.info).toHaveBeenCalledWith(
                            `Successfully deleted EmailAddress, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
                        );
                        expect(emailRepoMock.deleteById).toHaveBeenCalledTimes(1);
                    });
                });
            });
        });
    });
});

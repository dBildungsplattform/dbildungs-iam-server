import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ConfigTestModule, DatabaseTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { KeycloakUserService } from '../domain/keycloak-user.service.js';
import { KeycloakEventHandler } from './keycloak-event-handler.js';
import { faker } from '@faker-js/faker';
import { OXContextID, OXContextName, OXUserID, OXUserName } from '../../../shared/types/ox-ids.types.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { KeycloakClientError } from '../../../shared/error/keycloak-client.error.js';
import { EmailAddressDisabledEvent } from '../../../shared/events/email/email-address-disabled.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';

describe('KeycloakEventHandler', () => {
    let module: TestingModule;

    let sut: KeycloakEventHandler;
    let loggerMock: DeepMocked<ClassLogger>;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule, DatabaseTestModule.forRoot()],
            providers: [
                KeycloakEventHandler,
                { provide: EventRoutingLegacyKafkaService, useValue: createMock<EventRoutingLegacyKafkaService>() },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
            ],
        }).compile();

        sut = module.get(KeycloakEventHandler);
        loggerMock = module.get(ClassLogger);
        keycloakUserServiceMock = module.get(KeycloakUserService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('handleOxUserCreatedEvent', () => {
        let fakePersonID: PersonID;
        let fakeOXUserID: OXUserID;
        let fakeOXContextID: OXContextID;
        let fakeOXUserName: OXUserName;
        let fakeOXContextName: OXContextName;
        let fakeEmail: string;

        beforeEach(() => {
            fakePersonID = faker.string.uuid();
            fakeOXUserID = faker.string.uuid();
            fakeOXContextID = faker.string.uuid();
            fakeOXUserName = faker.internet.userName();
            fakeOXContextName = 'context1';
            fakeEmail = faker.internet.email();
        });
        it('should log info and call KeycloakUserService', async () => {
            keycloakUserServiceMock.updateOXUserAttributes.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });
            await sut.handleOxUserChangedEvent(
                new OxUserChangedEvent(
                    fakePersonID,
                    faker.internet.userName(),
                    fakeOXUserID,
                    fakeOXUserName,
                    fakeOXContextID,
                    fakeOXContextName,
                    fakeEmail,
                ),
            );
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Received OxUserChangedEvent personId:${fakePersonID}, userId:${fakeOXUserID}, userName:${fakeOXUserName} contextId:${fakeOXContextID}, contextName:${fakeOXContextName}, primaryEmail:${fakeEmail}`,
            );
            expect(keycloakUserServiceMock.updateOXUserAttributes).toHaveBeenCalledTimes(1);
        });

        describe('when updating user-attributes fails', () => {
            it('should log info and call KeycloakUserService', async () => {
                keycloakUserServiceMock.updateOXUserAttributes.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Could not update user-attributes'),
                });

                await sut.handleOxUserChangedEvent(
                    new OxUserChangedEvent(
                        fakePersonID,
                        faker.internet.userName(),
                        fakeOXUserID,
                        fakeOXUserName,
                        fakeOXContextID,
                        fakeOXContextName,
                        fakeEmail,
                    ),
                );

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `Received OxUserChangedEvent personId:${fakePersonID}, userId:${fakeOXUserID}, userName:${fakeOXUserName} contextId:${fakeOXContextID}, contextName:${fakeOXContextName}, primaryEmail:${fakeEmail}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Updating user in Keycloak FAILED for OxUserChangedEvent, personId:${fakePersonID}, userId:${fakeOXUserID}, userName:${fakeOXUserName} contextId:${fakeOXContextID}, contextName:${fakeOXContextName}, primaryEmail:${fakeEmail}`,
                );
                expect(loggerMock.error).toHaveBeenLastCalledWith(
                    `OxMetadataInKeycloakChangedEvent will NOT be published, email-address for personId:${fakePersonID} in REQUESTED status will NOT be ENABLED!`,
                );
            });
        });
    });

    describe('handleEmailAddressDisabledEvent', () => {
        let fakePersonID: PersonID;
        let fakeUsername: string;

        beforeEach(() => {
            fakePersonID = faker.string.uuid();
            fakeUsername = faker.internet.userName();
        });
        it('should log info and call KeycloakUserService', async () => {
            keycloakUserServiceMock.removeOXUserAttributes.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.handleEmailAddressDisabledEvent(new EmailAddressDisabledEvent(fakePersonID, fakeUsername));

            expect(loggerMock.info).toHaveBeenNthCalledWith(
                1,
                `Received EmailAddressDisabledEvent personId:${fakePersonID}, username:${fakeUsername}`,
            );
            expect(loggerMock.info).toHaveBeenNthCalledWith(
                2,
                `Removed OX access for personId:${fakePersonID}, username:${fakeUsername} in Keycloak`,
            );
            expect(keycloakUserServiceMock.removeOXUserAttributes).toHaveBeenCalledTimes(1);
        });

        describe('when updating user-attributes fails', () => {
            it('should log info and call KeycloakUserService', async () => {
                keycloakUserServiceMock.removeOXUserAttributes.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Could not update user-attributes'),
                });

                await sut.handleEmailAddressDisabledEvent(new EmailAddressDisabledEvent(fakePersonID, fakeUsername));

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `Received EmailAddressDisabledEvent personId:${fakePersonID}, username:${fakeUsername}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Updating user in Keycloak FAILED for EmailAddressDisabledEvent, personId:${fakePersonID}, username:${fakeUsername}`,
                );
            });
        });
    });

    //kap
    describe('handleEmailAddressesPurgedEvent', () => {
        let fakePersonID: PersonID;
        let fakeUsername: string;
        let fakeOxUserID: OXUserID;
        let event: EmailAddressesPurgedEvent;

        beforeEach(() => {
            fakePersonID = faker.string.uuid();
            fakeUsername = faker.internet.userName();
            fakeOxUserID = faker.string.numeric();
            event = new EmailAddressesPurgedEvent(fakePersonID, fakeUsername, fakeOxUserID);
        });

        describe('when username is UNDEFINED in event', () => {
            it('should log info about that and return without calling removeOXUserAttributes', async () => {
                event = new EmailAddressesPurgedEvent(fakePersonID, undefined, fakeOxUserID);

                await sut.handleEmailAddressesPurgedEvent(event);

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `EmailAddressesPurgedEvent had UNDEFINED username, skipping removeOXUserAttributes, oxUserId:${event.oxUserId}`,
                );
                expect(keycloakUserServiceMock.removeOXUserAttributes).toHaveBeenCalledTimes(0);
            });
        });

        describe('when updating user-attributes fails', () => {
            it('should log error about failure', async () => {
                keycloakUserServiceMock.removeOXUserAttributes.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Could not update user-attributes'),
                });

                await sut.handleEmailAddressesPurgedEvent(event);

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `Received EmailAddressesPurgedEvent personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Updating user in Keycloak FAILED for EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}`,
                );
            });
        });

        describe('when updating user-attributes succeeds', () => {
            it('should log info about success', async () => {
                keycloakUserServiceMock.removeOXUserAttributes.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });

                await sut.handleEmailAddressesPurgedEvent(event);

                expect(loggerMock.info).toHaveBeenNthCalledWith(
                    1,
                    `Received EmailAddressesPurgedEvent personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
                );
                expect(loggerMock.info).toHaveBeenNthCalledWith(
                    2,
                    `Removed OX access for personId:${event.personId}, username:${event.username} in Keycloak`,
                );
            });
        });
    });
});

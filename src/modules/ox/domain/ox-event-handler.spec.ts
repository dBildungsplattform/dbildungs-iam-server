import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressID, OrganisationKennung, PersonID, PersonReferrer } from '../../../shared/types/index.js';
import { OxEventHandler } from './ox-event-handler.js';
import { OxService } from './ox.service.js';
import { CreateUserAction } from '../actions/user/create-user.action.js';
import { OxError } from '../../../shared/error/ox.error.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email/email-address-generated.event.js';
import { ExistsUserAction } from '../actions/user/exists-user.action.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email/email-address-changed.event.js';
import { GetDataForUserResponse } from '../actions/user/get-data-user.action.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/index.js';
import { OXContextID, OXContextName, OXGroupID, OXUserID } from '../../../shared/types/ox-ids.types.js';
import { ListGroupsAction } from '../actions/group/list-groups.action.js';
import { EmailAddressAlreadyExistsEvent } from '../../../shared/events/email/email-address-already-exists.event.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { EmailAddressDisabledEvent } from '../../../shared/events/email/email-address-disabled.event.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { DisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/disabled-email-address-generated.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { EmailAddressDeletedEvent } from '../../../shared/events/email/email-address-deleted.event.js';
import { PersonenkontextEventKontextData } from '../../../shared/events/personenkontext-event.types.js';
import { PersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/person-deleted-after-deadline-exceeded.event.js';

describe('OxEventHandler', () => {
    let module: TestingModule;

    let sut: OxEventHandler;
    let oxServiceMock: DeepMocked<OxService>;
    let loggerMock: DeepMocked<ClassLogger>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let eventServiceMock: DeepMocked<EventRoutingLegacyKafkaService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule, DatabaseTestModule.forRoot()],
            providers: [
                OxEventHandler,
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: EmailRepo,
                    useValue: createMock<EmailRepo>(),
                },
                {
                    provide: OxService,
                    useValue: createMock<OxService>(),
                },
                {
                    provide: EventRoutingLegacyKafkaService,
                    useValue: createMock<EventRoutingLegacyKafkaService>(),
                },
            ],
        }).compile();

        sut = module.get(OxEventHandler);
        oxServiceMock = module.get(OxService);
        loggerMock = module.get(ClassLogger);

        personRepositoryMock = module.get(PersonRepository);
        emailRepoMock = module.get(EmailRepo);
        eventServiceMock = module.get(EventRoutingLegacyKafkaService);
    });

    function getRequestedEmailAddresses(address?: string): EmailAddress<true>[] {
        const emailAddress: EmailAddress<true> = createMock<EmailAddress<true>>({
            get address(): string {
                return address ?? faker.internet.email();
            },
        });
        return [emailAddress];
    }

    function mockUserCreationRequest(userId: OXUserID, emailAddress: string): void {
        //mock create-oxUser-request
        oxServiceMock.send.mockResolvedValueOnce({
            ok: true,
            value: {
                id: userId,
                firstname: 'firstname',
                lastname: 'lastname',
                username: 'username',
                primaryEmail: emailAddress,
                mailenabled: true,
            },
        });
    }

    /**
     * Mock group retrieval as successful
     * @param oxUserId
     * @param oxGroupId default is 'groupId'
     */
    function mockGroupRetrievalRequestSuccessful(oxUserId: OXUserID, oxGroupId: OXGroupID = 'groupId'): void {
        oxServiceMock.send.mockResolvedValueOnce({
            ok: true,
            value: {
                groups: [
                    {
                        displayname: 'groupDisplayName',
                        id: oxGroupId,
                        name: 'groupName',
                        memberIds: [oxUserId],
                    },
                ],
            },
        });
    }

    /**
     * mock exists-oxUser-request
     * @param exists default is FALSE
     */
    function mockExistsUserRequest(exists: boolean = false): void {
        oxServiceMock.send.mockResolvedValueOnce({
            ok: true,
            value: {
                exists: exists,
            },
        });
    }

    /**
     * Returns an instance of GetDataForUserResponse.
     * If id, username, primaryMail or aliases are undefined, they will be set with default fake values.
     * Firstname and lastname are always set to fake values and mailenabled to true.
     */
    function getGetDataForUserResponse(
        id?: OXUserID,
        username?: string,
        primaryMail?: string,
        aliases?: string[],
    ): GetDataForUserResponse {
        return {
            id: id ?? faker.string.numeric(),
            username: username ?? faker.internet.userName(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            mailenabled: true,
            primaryEmail: primaryMail ?? faker.internet.email(),
            aliases: aliases ?? [],
        };
    }

    /**
     * Returns an instance of Person. Fake values are used for any non-defined optional parameter.
     * @param id
     * @param username
     * @param oxUserId
     * @param email
     */
    function getPerson(id?: PersonID, username?: PersonReferrer, oxUserId?: OXUserID, email?: string): Person<true> {
        return createMock<Person<true>>({
            id: id ?? faker.string.uuid(),
            referrer: username ?? faker.internet.userName(),
            oxUserId: oxUserId ?? faker.string.numeric(),
            email: email ?? faker.internet.email(),
        });
    }

    /**
     * Returns an instance of PersonenkontextUpdatedEvent. RemovedKontexte contains two PersonenkontextEventKontextData, one with rollenArt LEHR and one with EXTERN.
     * @param personId
     * @param rollenArtLehrPKOrgaKennung
     * @param withRemainingCurrentPK true: add one PersonenkontextEventKontextData with rollenArt LEHR to currentKontexte, false: set empty currentKontexte
     */
    function getPersonenkontextUpdatedEvent(
        personId: PersonID,
        rollenArtLehrPKOrgaKennung: string,
        withRemainingCurrentPK: boolean,
    ): PersonenkontextUpdatedEvent {
        const pkEventDataRollenartLehr: PersonenkontextEventKontextData = {
            id: faker.string.uuid(),
            orgaId: faker.string.uuid(),
            rolle: RollenArt.LEHR,
            rolleId: faker.string.uuid(),
            orgaKennung: rollenArtLehrPKOrgaKennung,
            isItslearningOrga: false,
            serviceProviderExternalSystems: [],
        };
        const currentKontexte: PersonenkontextEventKontextData[] = [];
        if (withRemainingCurrentPK) {
            currentKontexte.push(pkEventDataRollenartLehr);
        }
        const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
            {
                id: personId,
                vorname: faker.person.firstName(),
                familienname: faker.person.lastName(),
                username: faker.internet.userName(),
            },
            [],
            [
                //removed PKs
                pkEventDataRollenartLehr,
                {
                    id: faker.string.uuid(),
                    orgaId: faker.string.uuid(),
                    rolle: RollenArt.EXTERN,
                    rolleId: faker.string.uuid(),
                    orgaKennung: faker.string.numeric(7),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ],
            currentKontexte,
        );
        return event;
    }
    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        sut.ENABLED = true;
        jest.resetAllMocks();
    });

    describe('createOxGroup', () => {
        let personId: PersonID;
        let fakeDstNr: string;
        let event: EmailAddressGeneratedEvent;
        let person: Person<true>;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            fakeDstNr = faker.string.numeric();
            event = new EmailAddressGeneratedEvent(
                personId,
                faker.internet.userName(),
                faker.string.uuid(),
                faker.internet.email(),
                true,
                fakeDstNr,
            );
            person = createMock<Person<true>>({ email: faker.internet.email(), referrer: faker.internet.userName() });
        });

        describe('when creating group fails', () => {
            it('should log error about failing oxGroup-creation', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>(),
                ]);

                //mock exists-oxUser-request
                mockExistsUserRequest(false);
                //mock create-oxUser-request
                const fakeOXUserId: string = faker.string.uuid();
                mockUserCreationRequest(fakeOXUserId, event.address);
                //mock list-oxGroups-request: empty result -> no groups found
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [],
                    },
                });
                //mock create-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });

                await sut.handleEmailAddressGeneratedEvent(event);

                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Create OxGroup with name:lehrer-${fakeDstNr}, displayName:lehrer-${fakeDstNr}`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('getOxGroupByName', () => {
        let personId: PersonID;
        let fakeDstNr: string;
        let event: EmailAddressGeneratedEvent;
        let person: Person<true>;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            fakeDstNr = faker.string.numeric();
            event = new EmailAddressGeneratedEvent(
                personId,
                faker.internet.userName(),
                faker.string.uuid(),
                faker.internet.email(),
                true,
                fakeDstNr,
            );
            person = createMock<Person<true>>({ email: faker.internet.email(), referrer: faker.internet.userName() });
        });

        describe('when existing group is found', () => {
            it('should return the existing groups id', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>(),
                ]);

                //mock exists-oxUser-request
                mockExistsUserRequest(false);
                //mock create-oxUser-request
                const fakeOXUserId: string = faker.string.uuid();
                mockUserCreationRequest(fakeOXUserId, event.address);
                //mock list-oxGroups-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [
                            {
                                displayname: `lehrer-${fakeDstNr}`,
                                id: 'id',
                                name: `lehrer-${fakeDstNr}`,
                                memberIds: [],
                            },
                        ],
                    },
                });

                //mock add-member-to-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });
                //mock changeByModuleAccess request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });

                await sut.handleEmailAddressGeneratedEvent(event);

                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Found existing oxGroup for oxGroupName:lehrer-${fakeDstNr}`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(1);
            });
        });

        describe('when OX-request fails', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>(),
                ]);

                //mock exists-oxUser-request
                mockExistsUserRequest(false);
                //mock create-oxUser-request
                const fakeOXUserId: string = faker.string.uuid();
                mockUserCreationRequest(fakeOXUserId, event.address);
                //mock list-oxGroups-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError('mockError'),
                });

                await sut.handleEmailAddressGeneratedEvent(event);

                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(ListGroupsAction));

                expect(loggerMock.error).toHaveBeenCalledWith(`Could Not Retrieve Groups For Context, contextId:10`);
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });

        describe('when no matching groups is found', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>(),
                ]);

                //mock exists-oxUser-request
                mockExistsUserRequest(false);
                //mock create-oxUser-request
                const fakeOXUserId: string = faker.string.uuid();
                mockUserCreationRequest(fakeOXUserId, event.address);
                //mock list-oxGroups-request, mock no matching group found
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [],
                    },
                });
                const fakeOxGroupId: OXGroupID = faker.string.uuid();
                //mock create-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        id: fakeOxGroupId,
                    },
                });
                //mock add-member-to-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });
                //mock changeByModuleAccess request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });

                await sut.handleEmailAddressGeneratedEvent(event);

                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(ListGroupsAction));

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Found No Matching OxGroup For OxGroupName:lehrer-${fakeDstNr}`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(1);
            });
        });

        describe('when multiple groups are found for same groupName', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>(),
                ]);

                //mock exists-oxUser-request
                mockExistsUserRequest(false);
                //mock create-oxUser-request
                const fakeOXUserId: string = faker.string.uuid();
                mockUserCreationRequest(fakeOXUserId, event.address);
                //mock list-oxGroups-request, mock no matching group found
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [
                            {
                                displayname: `lehrer-${fakeDstNr}`,
                                id: 'id',
                                name: `lehrer-${fakeDstNr}`,
                                memberIds: [],
                            },
                            {
                                displayname: `lehrer-${fakeDstNr}`,
                                id: 'id',
                                name: `lehrer-${fakeDstNr}-`,
                                memberIds: [],
                            },
                        ],
                    },
                });

                await sut.handleEmailAddressGeneratedEvent(event);

                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(ListGroupsAction));

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Found multiple OX-groups For OxGroupName:lehrer-${fakeDstNr}, Cannot Proceed`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('addOxUserToOxGroup', () => {
        let personId: PersonID;
        let fakeDstNr: string;
        let event: EmailAddressGeneratedEvent;
        let person: Person<true>;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            fakeDstNr = faker.string.numeric();
            event = new EmailAddressGeneratedEvent(
                personId,
                faker.internet.userName(),
                faker.string.uuid(),
                faker.internet.email(),
                true,
                fakeDstNr,
            );
            person = createMock<Person<true>>({ email: faker.internet.email(), referrer: faker.internet.userName() });
        });

        describe('when adding user as member to group fails', () => {
            it('should log error about failing addition to group', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([
                    createMock<EmailAddress<true>>(),
                ]);

                //mock exists-oxUser-request
                mockExistsUserRequest(false);
                //mock create-oxUser-request
                const fakeOXUserId: string = faker.string.uuid();
                mockUserCreationRequest(fakeOXUserId, event.address);
                //mock list-oxGroups-request, empty result -> no groups found
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [],
                    },
                });
                const fakeOxGroupId: OXGroupID = faker.string.uuid();
                //mock create-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        id: fakeOxGroupId,
                    },
                });
                //mock add-member-to-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });

                await sut.handleEmailAddressGeneratedEvent(event);

                expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Add OxUser To OxGroup, oxUserId:${fakeOXUserId}, oxGroupId:${fakeOxGroupId}`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('handleEmailAddressGeneratedEvent', () => {
        let personId: PersonID;
        let username: PersonReferrer;
        let event: EmailAddressGeneratedEvent;
        let person: Person<true>;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            event = new EmailAddressGeneratedEvent(
                personId,
                username,
                faker.string.uuid(),
                faker.internet.email(),
                true,
                faker.string.numeric(),
            );
            person = createMock<Person<true>>({ email: faker.internet.email(), referrer: username });
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            await sut.handleEmailAddressGeneratedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            expect(oxServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error when person already exists in OX', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([createMock<EmailAddress<true>>()]);
            //mock exists-oxUser-request
            mockExistsUserRequest(true);

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenLastCalledWith(expect.any(ExistsUserAction));
            expect(oxServiceMock.send).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Cannot create user in OX, username:${person.referrer} already exists, personId:${personId}`,
            );
        });

        it('should log error when person cannot be found in DB', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(undefined);

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Person not found for personId:${personId}, username:${username}`,
            );
        });

        it('should log error when person has no username set', async () => {
            person.referrer = undefined;
            personRepositoryMock.findById.mockResolvedValueOnce(person);

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Person with personId:${personId} has no username: cannot create OXEmailAddress`,
            );
        });

        it('should log error when EmailAddress for person cannot be found', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `No REQUESTED email-address found for personId:${personId}`,
            );
        });

        it('should log info and publish OxUserCreatedEvent on success', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([createMock<EmailAddress<true>>()]);

            //mock exists-oxUser-request
            mockExistsUserRequest(false);
            //mock create-oxUser-request
            const fakeOXUserId: string = faker.string.uuid();
            mockUserCreationRequest(fakeOXUserId, event.address);
            //mock list-oxGroups-request, no result -> mocks no group found
            const fakeOXGroupId: string = faker.string.uuid();
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    groups: [],
                },
            });
            //mock create-oxGroup-request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    id: fakeOXGroupId,
                },
            });
            //mock add-member-to-oxGroup-request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    status: {
                        code: 'success',
                    },
                    data: undefined,
                },
            });
            //mock changeByModuleAccess request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
            expect(loggerMock.info).toHaveBeenCalledWith(
                `User created in OX, oxUserId:${fakeOXUserId}, oxEmail:${event.address}, personId:${personId}, username:${username}`,
            );
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Successfully Added OxUser To OxGroup, oxUserId:${fakeOXUserId}, oxGroupId:${fakeOXGroupId}`,
            );
            expect(eventServiceMock.publish).toHaveBeenCalledTimes(1);
        });

        it('should log error but still publish OxUserCreatedEvent when changeByModuleAccess request fails', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([createMock<EmailAddress<true>>()]);

            //mock exists-oxUser-request
            mockExistsUserRequest(false);
            //mock create-oxUser-request
            const fakeOXUserId: string = faker.string.uuid();
            mockUserCreationRequest(fakeOXUserId, event.address);
            //mock list-oxGroups-request, no result -> mocks no group found
            const fakeOXGroupId: string = faker.string.uuid();
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    groups: [],
                },
            });
            //mock create-oxGroup-request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    id: fakeOXGroupId,
                },
            });
            //mock add-member-to-oxGroup-request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    status: {
                        code: 'success',
                    },
                    data: undefined,
                },
            });
            //mock changeByModuleAccess request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: new OxError(),
            });

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Could Not Adjust GlobalAddressBookDisabled For oxUserId:${fakeOXUserId}, personId:${personId}, username:${username}, error:Unknown OX-error`,
            );
            expect(eventServiceMock.publish).toHaveBeenCalledTimes(1);
        });

        it('should log error when persisting oxUserId fails', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([createMock<EmailAddress<true>>()]);

            //mock exists-oxUser-request
            mockExistsUserRequest(false);
            //mock create-oxUser-request
            const fakeOXUserId: string = faker.string.uuid();
            mockUserCreationRequest(fakeOXUserId, event.address);
            //mock list-all-oxGroups-request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    groups: [
                        {
                            displayname: 'string',
                            id: 'id',
                            name: 'name',
                            memberIds: [],
                        },
                    ],
                },
            });
            //mock create-oxGroup-request
            const fakeOxGroupId: OXGroupID = faker.string.uuid();
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    id: fakeOxGroupId,
                },
            });
            //mock add-member-to-oxGroup-request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    status: {
                        code: 'success',
                    },
                    data: undefined,
                },
            });

            emailRepoMock.save.mockResolvedValueOnce(new EntityCouldNotBeCreated('EmailAddress'));

            //mock changeByModuleAccess request
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledWith(expect.any(CreateUserAction));
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `User created in OX, oxUserId:${fakeOXUserId}, oxEmail:${event.address}, personId:${personId}, username:${username}`,
            );
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Persisting oxUserId on emailAddress failed, personId:${personId}, username:${username}`,
            );
            expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
        });

        it('should log error on failure', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([createMock<EmailAddress<true>>()]);

            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    exists: false,
                },
            });

            oxServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: new OxError('Request failed'),
            });
            await sut.handleEmailAddressGeneratedEvent(event);

            expect(oxServiceMock.send).toHaveBeenLastCalledWith(expect.any(CreateUserAction));
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Could not create user in OX, personId:${personId}, username:${username}, error:Request failed`,
            );
        });
    });

    describe('handleEmailAddressChangedEvent', () => {
        let personId: PersonID;
        let event: EmailAddressChangedEvent;
        let person: Person<true>;
        let username: PersonReferrer;
        let email: string;
        let oxUserId: string;
        let oxUserName: string;
        let contextId: string;
        let contextName: string;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            email = faker.internet.email();
            oxUserId = faker.string.numeric();
            oxUserName = faker.internet.userName();
            contextId = '10';
            contextName = 'testContext';
            event = new EmailAddressChangedEvent(
                personId,
                username,
                faker.string.uuid(),
                faker.internet.email(),
                faker.string.uuid(),
                faker.internet.email(),
                faker.string.numeric(),
            );
            person = createMock<Person<true>>({ email: email, referrer: username, oxUserId: oxUserId });
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            await sut.handleEmailAddressChangedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            expect(oxServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error when person cannot be found in DB', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(undefined);

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Person not found for personId:${personId}, username:${username}`,
            );
        });

        it('should log error when person has no username set', async () => {
            person.referrer = undefined;
            personRepositoryMock.findById.mockResolvedValueOnce(person);

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Person with personId:${personId} has no username: Cannot Change Email-Address In OX`,
            );
        });

        it('should log error when person has no oxUserId set', async () => {
            person.oxUserId = undefined;
            personRepositoryMock.findById.mockResolvedValueOnce(person);

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Person has no OXUserId, personId:${personId}, username:${username}`,
            );
        });

        it('should log error when no requestedEmailAddress is found for person', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce([]);

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `No REQUESTED email-address found for personId:${personId}`,
            );
        });

        it('should log error when getData for user request fails', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce(getRequestedEmailAddresses());

            oxServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: new OxError('Request failed'),
            });

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Cannot get data for oxUsername:${person.referrer} from OX, Aborting Email-Address Change, personId:${personId}, username:${username}`,
            );
        });

        it('should log error when changeUser request fails', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce(getRequestedEmailAddresses());

            //mock getData
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: createMock<GetDataForUserResponse>({
                    aliases: [faker.internet.email()],
                }),
            });

            //mock changeUser
            oxServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: new OxError('Request failed'),
            });

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(2);
            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `Could not change email-address for oxUserId:${person.oxUserId}, personId:${personId}, username:${username}, error:Request failed`,
            );
        });

        it('should publish OxUserChangedEvent on success', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce(getRequestedEmailAddresses(email));
            const currentAliases: string[] = [faker.internet.email()];
            //mock getData
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: createMock<GetDataForUserResponse>({
                    aliases: currentAliases,
                    username: oxUserName,
                    id: oxUserId,
                    primaryEmail: email,
                }),
            });

            //mock changeUser as success
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.handleEmailAddressChangedEvent(event);

            expect(oxServiceMock.send).toHaveBeenCalledTimes(2);
            expect(loggerMock.error).toHaveBeenCalledTimes(0);
            expect(loggerMock.info).toHaveBeenCalledWith(
                `Found mostRecentRequested Email-Address:${JSON.stringify(email)} For personId:${personId}`,
            );
            //use regex, because strict comparison fails, local test-var currentAliases has changed by the implemented function when expect is checked here
            expect(loggerMock.info).toHaveBeenCalledWith(expect.stringMatching(/Found Current aliases:.*/));
            expect(loggerMock.info).toHaveBeenCalledWith(
                `Added New alias:${email}, personId:${personId}, username:${username}`,
            );
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Changed primary email-address in OX for user, personId:${personId}, username:${username}, oxUserId:${oxUserId}, oxUsername:${username}, new email-address:${email}`,
            );
            expect(eventServiceMock.publish).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    personId: personId,
                    keycloakUsername: username,
                    oxUserId: oxUserId,
                    oxUserName: username, //this is the new OxUserName, it's changed on renaming in SPSH
                    oxContextId: contextId,
                    oxContextName: contextName,
                    primaryEmail: email,
                }),
                expect.objectContaining({
                    personId: personId,
                    keycloakUsername: username,
                    oxUserId: oxUserId,
                    oxUserName: username, //this is the new OxUserName, it's changed on renaming in SPSH
                    oxContextId: contextId,
                    oxContextName: contextName,
                    primaryEmail: email,
                }),
            );
        });
    });

    /**
     * Testing the called method changeOxUser in general is done via test-cases for handleEmailAddressChangedEvent.
     */
    describe('handleDisabledEmailAddressGeneratedEvent', () => {
        let personId: PersonID;
        let event: DisabledEmailAddressGeneratedEvent;
        let person: Person<true>;
        let username: PersonReferrer;
        let emailId: string;
        let email: string;
        let domain: string;
        let oxUserId: string;
        let oxUserName: string;
        let contextId: string;
        let contextName: string;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            emailId = faker.string.uuid();
            email = faker.internet.email();
            domain = faker.internet.domainName();
            oxUserId = faker.string.numeric();
            oxUserName = faker.internet.userName();
            contextId = '10';
            contextName = 'testContext';
            event = new DisabledEmailAddressGeneratedEvent(personId, username, email, emailId, domain);
            person = createMock<Person<true>>({ email: email, referrer: username, oxUserId: oxUserId });
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            await sut.handleDisabledEmailAddressGeneratedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            expect(oxServiceMock.send).not.toHaveBeenCalled();
        });

        it('should publish DisabledOxUserChangedEvent on success', async () => {
            personRepositoryMock.findById.mockResolvedValueOnce(person);
            emailRepoMock.findByPersonSortedByUpdatedAtDesc.mockResolvedValueOnce(getRequestedEmailAddresses(email));
            const currentAliases: string[] = [faker.internet.email()];
            //mock getData
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: createMock<GetDataForUserResponse>({
                    aliases: currentAliases,
                    username: oxUserName,
                    id: oxUserId,
                    primaryEmail: email,
                }),
            });

            //mock changeUser as success
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.handleDisabledEmailAddressGeneratedEvent(event);

            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Changed primary email-address in OX for user, personId:${personId}, username:${username}, oxUserId:${oxUserId}, oxUsername:${username}, new email-address:${email}`,
            );
            expect(eventServiceMock.publish).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    personId: personId,
                    keycloakUsername: username,
                    oxUserId: oxUserId,
                    oxUserName: username, //this is the new OxUserName, it's changed on renaming in SPSH
                    oxContextId: contextId,
                    oxContextName: contextName,
                    primaryEmail: email,
                }),
                expect.objectContaining({
                    personId: personId,
                    keycloakUsername: username,
                    oxUserId: oxUserId,
                    oxUserName: username, //this is the new OxUserName, it's changed on renaming in SPSH
                    oxContextId: contextId,
                    oxContextName: contextName,
                    primaryEmail: email,
                }),
            );
        });
    });

    describe('handleEmailAddressAlreadyExistsEvent', () => {
        let personId: PersonID;
        let event: EmailAddressAlreadyExistsEvent;
        let person: Person<true>;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            event = new EmailAddressAlreadyExistsEvent(personId, faker.string.uuid());
            person = createMock<Person<true>>({ email: faker.internet.email(), referrer: faker.internet.userName() });
        });

        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handleEmailAddressAlreadyExistsEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });

        describe('when person is not found', () => {
            it('should log error if person does not exist', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await sut.handleEmailAddressAlreadyExistsEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(`Person not found for personId:${event.personId}`);
            });
        });

        describe('when person has no oxUserId', () => {
            it('should log error if oxUserId is missing', async () => {
                person.oxUserId = undefined;
                personRepositoryMock.findById.mockResolvedValueOnce(person);

                await sut.handleEmailAddressAlreadyExistsEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Person with personId:${event.personId} does not have an oxUserId. Cannot add to group.`,
                );
            });
        });

        describe('successful scenario', () => {
            it('should successfully process event and publish OxUserChangedEvent', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);

                //mock list-oxGroups-request, no result -> mocks no group found
                const fakeOXGroupId: string = faker.string.uuid();
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [],
                    },
                });
                //mock create-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        id: fakeOXGroupId,
                    },
                });
                //mock add-member-to-oxGroup-request
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });

                await sut.handleEmailAddressAlreadyExistsEvent(event);

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `Successfully added user to group, personId:${event.personId}, oxUserId:${person.oxUserId}, oxGroupId:${fakeOXGroupId}`,
                );
                expect(eventServiceMock.publish).toHaveBeenCalledTimes(1);
            });
        });

        describe('failure scenarios', () => {
            it('should log error if group creation/retrieval fails', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);

                // Mock group creation/retrieval failure
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });

                await sut.handleEmailAddressAlreadyExistsEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining(
                        `Get or create OX group failed, personId:${event.personId}, oxUserId:${person.oxUserId}, orgaKennung:${event.orgaKennung}`,
                    ),
                );
            });

            it('should log error if adding user to group fails', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);

                const fakeOXGroupId: string = faker.string.uuid();

                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [],
                    },
                });
                // Mock group creation/retrieval success
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        id: fakeOXGroupId,
                    },
                });

                // Mock add user to group failure
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });

                await sut.handleEmailAddressAlreadyExistsEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining(
                        `Failed to add user to group, personId:${event.personId}, oxUserId:${person.oxUserId}, oxGroupId:${fakeOXGroupId}`,
                    ),
                );
            });
        });
    });

    describe('handlePersonDeletedEvent', () => {
        let personId: PersonID;
        let event: PersonDeletedEvent;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            event = new PersonDeletedEvent(personId, faker.string.uuid(), faker.internet.email());
        });

        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handlePersonDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });

        describe('when emailAddress is NOT defined in event', () => {
            it('should log error about missing emailAddress', async () => {
                event = new PersonDeletedEvent(personId, faker.string.uuid(), undefined);

                await sut.handlePersonDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    'Cannot Create OX-delete-user-request, Email-Address Is Not Defined',
                );
            });
        });

        describe('when EmailAddress-entity CANNOT be found via address', () => {
            it('should log error about that', async () => {
                event = new PersonDeletedEvent(personId, faker.string.uuid(), faker.internet.email());

                emailRepoMock.findByAddress.mockResolvedValueOnce(undefined);

                await sut.handlePersonDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Cannot Create OX-delete-user-request For address:${event.emailAddress} Could Not Be Found`,
                );
            });
        });

        describe('when oxUserId is NOT defined on found EmailAddress', () => {
            it('should log error about missing oxUserId', async () => {
                event = new PersonDeletedEvent(personId, faker.string.uuid(), faker.internet.email());
                emailRepoMock.findByAddress.mockResolvedValueOnce(
                    createMock<EmailAddress<true>>({
                        get oxUserID(): Option<string> {
                            return undefined;
                        },
                    }),
                );

                await sut.handlePersonDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Cannot Create OX-delete-user-request For address:${event.emailAddress}, OxUserId Is Not Defined`,
                );
            });
        });

        describe('when delete-request to OX fails', () => {
            it('should log error about failing request', async () => {
                event = new PersonDeletedEvent(personId, faker.string.uuid(), faker.internet.email());
                const oxUserId: OXUserID = faker.string.numeric();

                emailRepoMock.findByAddress.mockResolvedValueOnce(
                    createMock<EmailAddress<true>>({
                        get oxUserID(): Option<string> {
                            return oxUserId;
                        },
                    }),
                );

                // Mock group retrieval successfully
                mockGroupRetrievalRequestSuccessful(oxUserId);

                // Mock removal as member from oxGroups successfully
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });

                // Mock delete request fails
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });

                await sut.handlePersonDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Delete OxAccount For oxUserId:${oxUserId}, error:Unknown OX-error`,
                );
            });
        });

        describe('when delete-request to OX succeeds', () => {
            it('should log info about success', async () => {
                event = new PersonDeletedEvent(personId, faker.string.uuid(), faker.internet.email());
                const oxUserId: OXUserID = faker.string.numeric();

                emailRepoMock.findByAddress.mockResolvedValueOnce(
                    createMock<EmailAddress<true>>({
                        get oxUserID(): Option<string> {
                            return oxUserId;
                        },
                    }),
                );

                // Mock group retrieval successfully
                mockGroupRetrievalRequestSuccessful(oxUserId);

                // Mock removal as member from oxGroups successfully
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });

                // Mock delete request succeeds
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });

                await sut.handlePersonDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`Successfully Deleted OxAccount For oxUserId:${oxUserId}`);
            });
        });
    });

    describe('handleEmailAddressDeletedEvent', () => {
        const contextId: OXContextID = '10';
        const contextName: OXContextName = 'testContext';

        let personId: PersonID;
        let username: PersonReferrer;
        let oxUserId: OXUserID;
        let emailAddressId: EmailAddressID;
        let status: EmailAddressStatus;
        let address: string;
        let event: EmailAddressDeletedEvent;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            oxUserId = faker.string.numeric();
            emailAddressId = faker.string.uuid();
            status = EmailAddressStatus.DISABLED;
            address = faker.internet.email();
            event = new EmailAddressDeletedEvent(personId, username, oxUserId, emailAddressId, status, address);
        });

        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handleEmailAddressDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Received EmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });

        describe('when getting current user-data from OX fails', () => {
            it('should log error about that', async () => {
                //mock: get-user-data fails
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });
                await sut.handleEmailAddressDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Cannot get data for oxUsername:${event.username} from OX, Aborting Email-Address Removal, personId:${event.personId}, username:${event.username}`,
                );
            });
        });

        describe('when getting current user-data from OX succeeds and aliases contains address', () => {
            it('should log infos about that', async () => {
                const aliases: string[] = [faker.internet.email(), address];
                const userData: GetDataForUserResponse = getGetDataForUserResponse(
                    oxUserId,
                    username,
                    address,
                    aliases,
                );
                //mock: get-user-data succeeds
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: userData,
                });
                //mock: change-user-data succeeds
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });
                await sut.handleEmailAddressDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Found Current aliases:${JSON.stringify(aliases)}, personId:${event.personId}, username:${event.username}`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Removed From alias:${event.address}, personId:${event.personId}, username:${event.username}`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully Removed EmailAddress from OxAccount, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
                );
                //kap
                expect(eventServiceMock.publish).toHaveBeenCalledWith(
                    expect.objectContaining({
                        personId: event.personId,
                        oxUserId: event.oxUserId,
                        username: event.username,
                        address: event.address,
                        oxContextId: contextId,
                        oxContextName: contextName,
                    }),
                    expect.objectContaining({
                        personId: event.personId,
                        oxUserId: event.oxUserId,
                        username: event.username,
                        address: event.address,
                        oxContextId: contextId,
                        oxContextName: contextName,
                    }),
                );
            });
        });

        describe('when getting current user-data from OX succeeds but changing user-data fails', () => {
            it('should log error about that', async () => {
                const userData: GetDataForUserResponse = getGetDataForUserResponse(oxUserId, username, address);
                //mock: get-user-data succeeds
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: userData,
                });
                const oxError: OxError = new OxError();
                //mock: change-user-data fails
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: oxError,
                });
                await sut.handleEmailAddressDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Remove EmailAddress from OxAccount, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}, error:${oxError.message}`,
                );
            });
        });
    });

    describe('handleEmailAddressesPurgedEvent', () => {
        let personId: PersonID;
        let username: PersonReferrer;
        let oxUserId: OXUserID;
        let event: EmailAddressesPurgedEvent;

        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            oxUserId = faker.string.numeric();
            event = new EmailAddressesPurgedEvent(personId, username, oxUserId);
        });

        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handleEmailAddressesPurgedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Received EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });

        describe('when delete-request to OX fails', () => {
            it('should log error about failure', async () => {
                // Mock group retrieval successfully
                mockGroupRetrievalRequestSuccessful(oxUserId);

                // Mock removal as member from oxGroups successfully
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });

                const error: OxError = new OxError();
                // Mock delete request fails
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: error,
                });

                await sut.handleEmailAddressesPurgedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Delete OxAccount For oxUserId:${event.oxUserId}, error:${error.message}`,
                );
            });
        });

        describe('when delete-request to OX succeeds', () => {
            it('should log info about success', async () => {
                // Mock group retrieval successfully
                mockGroupRetrievalRequestSuccessful(oxUserId);

                // Mock removal as member from oxGroups successfully
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });

                // Mock delete request succeeds
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: undefined,
                });

                await sut.handleEmailAddressesPurgedEvent(event);

                expect(eventServiceMock.publish).toHaveBeenCalledWith(
                    expect.objectContaining({
                        personId: personId,
                        username: username,
                        oxUserId: oxUserId,
                    }),
                    expect.objectContaining({
                        personId: personId,
                        username: username,
                        oxUserId: oxUserId,
                    }),
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully Deleted OxAccount For oxUserId:${event.oxUserId}`,
                );
            });
        });
    });

    describe('handleEmailAddressDisabledEvent', () => {
        let personId: PersonID;
        let username: string;
        let oxUserId: OXUserID;
        let event: EmailAddressDisabledEvent;
        let person: Person<true>;
        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            oxUserId = faker.string.numeric();
            event = new EmailAddressDisabledEvent(personId, username);
            person = createMock<Person<true>>({
                id: personId,
                email: faker.internet.email(),
                referrer: username,
                oxUserId: oxUserId,
            });
        });
        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handleEmailAddressDisabledEvent(event);
                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });
        describe('when person is not found', () => {
            it('should log error if person does not exist', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);
                await sut.handleEmailAddressDisabledEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(`Could Not Find Person For personId:${event.personId}`);
            });
        });
        describe('when person is found BUT has NO oxUserId', () => {
            it('should log error if person does not have a oxUserId', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>({ oxUserId: undefined }));
                await sut.handleEmailAddressDisabledEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Remove Person From OxGroups, No OxUserId For personId:${event.personId}`,
                );
            });
        });
        describe('when listing groups for user fails', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                //mock listing groups results in error
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });
                await sut.handleEmailAddressDisabledEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Retrieving OxGroups For OxUser Failed, personId:${event.personId}`,
                );
            });
        });
        describe('when removing user from groups fails for at least one group', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(person);
                //mock listing groups
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        groups: [
                            {
                                displayname: 'group1-displayname',
                                id: 'group1-id',
                                name: 'group1-name',
                                memberIds: [oxUserId],
                            },
                            {
                                displayname: 'group2-displayname',
                                id: 'group2-id',
                                name: 'group2-name',
                                memberIds: [oxUserId],
                            },
                        ],
                    },
                });
                //mock removing member from group-1 succeeds
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: 'body',
                    },
                });
                //mock removing member from group-2 results in error
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });
                await sut.handleEmailAddressDisabledEvent(event);
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully Removed OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:group1-id`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Remove OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:group2-id`,
                );
            });
        });
    });

    describe('handlePersonenkontextUpdatedEvent', () => {
        let personId: PersonID;
        let username: PersonReferrer;
        let oxUserId: OXUserID;
        let oxGroupId: OXGroupID;
        let rollenArtLehrPKOrgaKennung: OrganisationKennung;
        let event: PersonenkontextUpdatedEvent;
        let person: Person<true>;
        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            rollenArtLehrPKOrgaKennung = faker.string.numeric(7);
            oxUserId = faker.string.numeric();
            oxGroupId = faker.string.numeric();
            event = getPersonenkontextUpdatedEvent(personId, rollenArtLehrPKOrgaKennung, true);
        });
        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handlePersonenkontextUpdatedEvent(event);
                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });
        describe('when person CANNOT be found', () => {
            it('should log error about that', async () => {
                personRepositoryMock.findById.mockResolvedValue(undefined);
                await sut.handlePersonenkontextUpdatedEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(`Could Not Find Person For personId:${event.person.id}`);
            });
        });
        describe('when oxUserId is NOT defined', () => {
            it('should log error about that', async () => {
                person = createMock<Person<true>>({
                    email: faker.internet.email(),
                    referrer: username,
                    oxUserId: undefined,
                });
                personRepositoryMock.findById.mockResolvedValue(person);
                await sut.handlePersonenkontextUpdatedEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(`OxUserId Not Defined For personId:${event.person.id}`);
            });
        });
        describe('when getting oxGroupId by oxGroupName fails', () => {
            it('should log error about that', async () => {
                person = getPerson(personId, username, oxUserId);
                //mock Ox-getOxGroupByName-request results in an error
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: new OxError(),
                });
                personRepositoryMock.findById.mockResolvedValue(person);
                await sut.handlePersonenkontextUpdatedEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could Not Get OxGroupId For oxGroupName:${'lehrer-' + rollenArtLehrPKOrgaKennung}`,
                );
            });
        });
        describe('when removing user as member from oxGroup is successful', () => {
            it('should log info about that', async () => {
                person = getPerson(personId, username, oxUserId);
                personRepositoryMock.findById.mockResolvedValue(person);
                // Mock group retrieval successfully
                mockGroupRetrievalRequestSuccessful(oxUserId, oxGroupId);
                //mock Ox-removeOxUserFromOxGroup-request is successful
                oxServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: {
                        status: {
                            code: 'success',
                        },
                        data: undefined,
                    },
                });
                await sut.handlePersonenkontextUpdatedEvent(event);
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully Removed OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                );
            });
        });
    });

    describe('handlePersonDeletedAfterDeadlineExceededEvent', () => {
        let personId: PersonID;
        let username: PersonReferrer;
        let oxUserId: OXUserID;
        let event: PersonDeletedAfterDeadlineExceededEvent;
        let person: Person<true>;
        beforeEach(() => {
            jest.resetAllMocks();
            personId = faker.string.uuid();
            username = faker.internet.userName();
            oxUserId = faker.string.numeric();
            event = new PersonDeletedAfterDeadlineExceededEvent(personId, username, oxUserId);
        });

        describe('when handler is disabled', () => {
            it('should log and skip processing when not enabled', async () => {
                sut.ENABLED = false;
                await sut.handlePersonDeletedAfterDeadlineExceededEvent(event);
                expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event');
            });
        });

        describe('when user has no remaining PKs with rollenArt LEHR in currentKontexte', () => {
            describe('should change username in OX to personId, when change fails', () => {
                it('should log error', async () => {
                    person = getPerson(personId, username, oxUserId);
                    personRepositoryMock.findById.mockResolvedValue(person);
                    const oxError: OxError = new OxError();
                    //mock Ox-changeUser-request fails
                    oxServiceMock.send.mockResolvedValueOnce({
                        ok: false,
                        error: oxError,
                    });

                    await sut.handlePersonDeletedAfterDeadlineExceededEvent(event);

                    expect(loggerMock.error).toHaveBeenCalledWith(
                        `Could Not Change OxUsername, personId:${personId}, username:${username}, oxUserId:${oxUserId} After PersonDeletedAfterDeadlineExceededEvent, error:${oxError.message}`,
                    );
                });
            });
            describe('should change username in OX to personId, when change succeeds', () => {
                it('should log info', async () => {
                    person = getPerson(personId, username, oxUserId);
                    personRepositoryMock.findById.mockResolvedValue(person);
                    //mock Ox-changeUser-request is successful
                    oxServiceMock.send.mockResolvedValueOnce({
                        ok: true,
                        value: {
                            status: {
                                code: 'success',
                            },
                            data: undefined,
                        },
                    });

                    await sut.handlePersonDeletedAfterDeadlineExceededEvent(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Successfully Changed OxUsername, personId:${personId}, username:${username}, oxUserId:${oxUserId} After PersonDeletedAfterDeadlineExceededEvent`,
                    );
                });
            });
        });
    });
});

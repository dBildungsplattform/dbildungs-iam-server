import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, DatabaseTestModule, DoFactory, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ItsLearningError } from '../../../shared/error/its-learning.error.js';
import { RolleUpdatedEvent } from '../../../shared/events/rolle-updated.event.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { FailureStatusInfo } from '../actions/base-mass-action.js';
import { ItslearningMembershipRepo } from '../repo/itslearning-membership.repo.js';
import { ItslearningPersonRepo } from '../repo/itslearning-person.repo.js';
import { ItsLearningRolleEventHandler } from './itslearning-rolle.event-handler.js';

function createStatusFailure(message: string): FailureStatusInfo {
    return {
        codeMajor: 'failure',
        severity: 'error',
        codeMinor: {
            codeMinorField: [
                {
                    codeMinorName: 'create',
                    codeMinorValue: 'fail',
                },
            ],
        },
        description: {
            language: 'en',
            text: message,
        },
    };
}

describe('ItsLearning Rolle Event Handler', () => {
    let module: TestingModule;

    let sut: ItsLearningRolleEventHandler;
    let itslearningPersonRepoMock: DeepMocked<ItslearningPersonRepo>;
    let itslearningMembershipRepoMock: DeepMocked<ItslearningMembershipRepo>;
    let personRepoMock: DeepMocked<PersonRepository>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule, DatabaseTestModule.forRoot()],
            providers: [
                ItsLearningRolleEventHandler,
                {
                    provide: ItslearningPersonRepo,
                    useValue: createMock<ItslearningPersonRepo>(),
                },
                {
                    provide: ItslearningMembershipRepo,
                    useValue: createMock<ItslearningMembershipRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
            ],
        }).compile();

        sut = module.get(ItsLearningRolleEventHandler);
        itslearningPersonRepoMock = module.get(ItslearningPersonRepo);
        itslearningMembershipRepoMock = module.get(ItslearningMembershipRepo);
        personRepoMock = module.get(PersonRepository);
        personenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        sut.ENABLED = true;
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('rolleUpdatedEventHandler', () => {
        function createEvent(newSpIds: string[], oldSpIds: string[]): RolleUpdatedEvent {
            return new RolleUpdatedEvent(
                faker.string.uuid(),
                faker.helpers.enumValue(RollenArt),
                faker.word.noun(),
                faker.string.uuid(),
                [],
                [],
                newSpIds,

                faker.word.noun(),
                faker.string.uuid(),
                [],
                [],
                oldSpIds,
            );
        }

        describe('when itslearning status is unchanged', () => {
            it('should log info and return, if itslearning was removed and added at the same time', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                const spB: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                const event: RolleUpdatedEvent = createEvent([spA.id], [spB.id]);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(
                    new Map([
                        [spA.id, spA],
                        [spB.id, spB],
                    ]),
                );

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Itslearning status did not change during RoleUpdatedEvent, ignoring.`,
                );
            });

            it('should log info and return, if itslearning was neither added nor removed', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.NONE,
                });
                const spB: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.NONE,
                });
                const event: RolleUpdatedEvent = createEvent([spA.id], [spB.id]);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(
                    new Map([
                        [spA.id, spA],
                        [spB.id, spB],
                    ]),
                );

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Itslearning status did not change during RoleUpdatedEvent, ignoring.`,
                );
            });
        });

        describe('when itslearning was added', () => {
            it('should get persons and kontexte from db and send them to itslearning', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map([[spA.id, spA]]));
                const person: Person<true> = DoFactory.createPerson(true);
                personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor.mockResolvedValueOnce([
                    [person],
                    undefined,
                ]);
                itslearningPersonRepoMock.createOrUpdatePersons.mockResolvedValueOnce(
                    Ok({ status: [], value: undefined }),
                );
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor.mockResolvedValueOnce([
                    [personenkontext],
                    undefined,
                ]);
                itslearningMembershipRepoMock.createMembershipsMass.mockResolvedValueOnce(
                    Ok({ status: [], value: undefined }),
                );

                const event: RolleUpdatedEvent = createEvent([spA.id], []);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor).toHaveBeenCalledWith(
                    event.id,
                    expect.any(Number),
                    undefined,
                );
                expect(itslearningPersonRepoMock.createOrUpdatePersons).toHaveBeenCalledWith(
                    [expect.objectContaining({ id: person.id })],
                    event.eventID,
                );
                expect(personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor).toHaveBeenCalledWith(
                    event.id,
                    expect.any(Number),
                    undefined,
                );
                expect(itslearningMembershipRepoMock.createMembershipsMass).toHaveBeenCalledWith(
                    [
                        expect.objectContaining({
                            groupId: personenkontext.organisationId,
                            personId: personenkontext.personId,
                        }),
                    ],
                    event.eventID,
                );
            });

            it('should log specific errors', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map([[spA.id, spA]]));
                const person: Person<true> = DoFactory.createPerson(true);
                personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor.mockResolvedValueOnce([
                    [person],
                    undefined,
                ]);
                itslearningPersonRepoMock.createOrUpdatePersons.mockResolvedValueOnce(
                    Ok({
                        status: [createStatusFailure('Input Error')],
                        value: undefined,
                    }),
                );
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor.mockResolvedValueOnce([
                    [personenkontext],
                    undefined,
                ]);
                itslearningMembershipRepoMock.createMembershipsMass.mockResolvedValueOnce(
                    Ok({
                        status: [createStatusFailure('Input Error')],
                        value: undefined,
                    }),
                );

                const event: RolleUpdatedEvent = createEvent([spA.id], []);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Creation of person ${person.username} failed with the following reason: Input Error`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not give Rolle to person ${personenkontext.personId} at orga ${personenkontext.organisationId}, failed with the following reason: Input Error`,
                );
            });

            it('should log unexpected errors', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map([[spA.id, spA]]));
                const person: Person<true> = DoFactory.createPerson(true);
                personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor.mockResolvedValueOnce([
                    [person],
                    undefined,
                ]);
                itslearningPersonRepoMock.createOrUpdatePersons.mockResolvedValueOnce(
                    Err(new ItsLearningError('Unknown Error')),
                );
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor.mockResolvedValueOnce([
                    [personenkontext],
                    undefined,
                ]);
                itslearningMembershipRepoMock.createMembershipsMass.mockResolvedValueOnce(
                    Err(new ItsLearningError('Unknown Error')),
                );

                const event: RolleUpdatedEvent = createEvent([spA.id], []);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Creation of person ${person.username} failed with the following reason: Unknown Error`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not give Rolle to person ${personenkontext.personId} at orga ${personenkontext.organisationId}, failed with the following reason: Unknown Error`,
                );
            });
        });

        describe('when itslearning was removed', () => {
            it('should get persons and kontexte from db and delete them from itslearning', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map([[spA.id, spA]]));
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor.mockResolvedValueOnce([
                    [personenkontext],
                    undefined,
                ]);
                itslearningMembershipRepoMock.removeMembershipsMass.mockResolvedValueOnce(
                    Ok({ status: [], value: undefined }),
                );
                const person: Person<true> = DoFactory.createPerson(true);
                personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor.mockResolvedValueOnce([
                    [person],
                    undefined,
                ]);
                itslearningPersonRepoMock.deletePersons.mockResolvedValueOnce(Ok({ status: [], value: undefined }));

                const event: RolleUpdatedEvent = createEvent([], [spA.id]);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor).toHaveBeenCalledWith(
                    event.id,
                    expect.any(Number),
                    undefined,
                );
                expect(itslearningPersonRepoMock.deletePersons).toHaveBeenCalledWith([person.id], event.eventID);
                expect(personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor).toHaveBeenCalledWith(
                    event.id,
                    expect.any(Number),
                    undefined,
                );
                expect(itslearningMembershipRepoMock.removeMembershipsMass).toHaveBeenCalledWith(
                    [`membership-${personenkontext.personId}-${personenkontext.organisationId}`],
                    event.eventID,
                );
            });

            it('should log specific errors', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map([[spA.id, spA]]));
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor.mockResolvedValueOnce([
                    [personenkontext],
                    undefined,
                ]);
                itslearningMembershipRepoMock.removeMembershipsMass.mockResolvedValueOnce(
                    Ok({
                        status: [createStatusFailure('Input Error')],
                        value: undefined,
                    }),
                );
                const person: Person<true> = DoFactory.createPerson(true);
                personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor.mockResolvedValueOnce([
                    [person],
                    undefined,
                ]);
                itslearningPersonRepoMock.deletePersons.mockResolvedValueOnce(
                    Ok({
                        status: [createStatusFailure('Input Error')],
                        value: undefined,
                    }),
                );

                const event: RolleUpdatedEvent = createEvent([], [spA.id]);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not remove Rolle from person ${personenkontext.personId} at orga ${personenkontext.organisationId}, failed with the following reason: Input Error`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Deletion of person ${person.username} failed with the following reason: Input Error`,
                );
            });

            it('should log unexpected errors', async () => {
                const spA: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                    externalSystem: ServiceProviderSystem.ITSLEARNING,
                });
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map([[spA.id, spA]]));
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                personenkontextRepoMock.findWithRolleAtItslearningOrgaByCursor.mockResolvedValueOnce([
                    [personenkontext],
                    undefined,
                ]);
                itslearningMembershipRepoMock.removeMembershipsMass.mockResolvedValueOnce(
                    Err(new ItsLearningError('Unknown Error')),
                );
                const person: Person<true> = DoFactory.createPerson(true);
                personRepoMock.findWithRolleAndNoOtherItslearningKontexteByCursor.mockResolvedValueOnce([
                    [person],
                    undefined,
                ]);
                itslearningPersonRepoMock.deletePersons.mockResolvedValueOnce(
                    Err(new ItsLearningError('Unknown Error')),
                );

                const event: RolleUpdatedEvent = createEvent([], [spA.id]);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not remove Rolle from person ${personenkontext.personId} at orga ${personenkontext.organisationId}, failed with the following reason: Unknown Error`,
                );
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Deletion of person ${person.username} failed with the following reason: Unknown Error`,
                );
            });
        });

        describe('when not enabled', () => {
            it('should log info and return', async () => {
                sut.ENABLED = false;
                const event: RolleUpdatedEvent = createEvent([], []);

                await sut.rolleUpdatedEventHandler(event, () => {});

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Not enabled, ignoring event.`,
                );
            });
        });
    });
});

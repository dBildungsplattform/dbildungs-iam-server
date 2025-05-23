import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, DatabaseTestModule, DoFactory, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ItsLearningError } from '../../../shared/error/its-learning.error.js';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ItslearningMembershipRepo, SetMembershipsResult } from '../repo/itslearning-membership.repo.js';
import { ItslearningPersonRepo } from '../repo/itslearning-person.repo.js';
import { rollenartToIMSESInstitutionRole } from '../repo/role-utils.js';
import { ItsLearningSyncEventHandler } from './itslearning-sync.event-handler.js';

describe('ItsLearning Persons Event Handler', () => {
    let module: TestingModule;

    let sut: ItsLearningSyncEventHandler;
    let itslearningPersonRepoMock: DeepMocked<ItslearningPersonRepo>;
    let itslearningMembershipRepoMock: DeepMocked<ItslearningMembershipRepo>;
    let personRepoMock: DeepMocked<PersonRepository>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let orgaRepoMock: DeepMocked<OrganisationRepository>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule, DatabaseTestModule.forRoot()],
            providers: [
                ItsLearningSyncEventHandler,
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
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
            ],
        }).compile();

        sut = module.get(ItsLearningSyncEventHandler);
        itslearningPersonRepoMock = module.get(ItslearningPersonRepo);
        itslearningMembershipRepoMock = module.get(ItslearningMembershipRepo);
        personRepoMock = module.get(PersonRepository);
        personenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        rolleRepoMock = module.get(RolleRepo);
        orgaRepoMock = module.get(OrganisationRepository);
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

    describe('personExternalSystemSyncEventHandler', () => {
        const person: Person<true> = DoFactory.createPerson(true, { referrer: faker.internet.userName() });

        const schuleWithItslearning: Organisation<true> = DoFactory.createOrganisation(true, {
            typ: OrganisationsTyp.SCHULE,
            itslearningEnabled: true,
        });
        const klasseWithItslearning: Organisation<true> = DoFactory.createOrganisation(true, {
            typ: OrganisationsTyp.KLASSE,
            administriertVon: schuleWithItslearning.id,
        });
        const schuleWithoutItslearning: Organisation<true> = DoFactory.createOrganisation(true, {
            typ: OrganisationsTyp.SCHULE,
            itslearningEnabled: false,
        });
        const klasseWithoutItslearning: Organisation<true> = DoFactory.createOrganisation(true, {
            typ: OrganisationsTyp.KLASSE,
            administriertVon: schuleWithoutItslearning.id,
        });
        const unknownOrgaType: Organisation<true> = DoFactory.createOrganisation(true, {
            typ: OrganisationsTyp.UNBEST,
        });

        const itslearningProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
            externalSystem: ServiceProviderSystem.ITSLEARNING,
        });

        const rolleWithItslearning: Rolle<true> = DoFactory.createRolle(true, {
            serviceProviderData: [itslearningProvider],
        });
        const rolleWithoutItslearning: Rolle<true> = DoFactory.createRolle(true);

        const personenkontextAtSchuleWithItslearning: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
            rolleId: rolleWithItslearning.id,
            organisationId: schuleWithItslearning.id,
        });
        const personenkontextAtSchuleWithoutItslearning: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
            rolleId: rolleWithoutItslearning.id,
            organisationId: schuleWithoutItslearning.id,
        });
        const personenkontextAtKlasseWithItslearning: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
            rolleId: rolleWithItslearning.id,
            organisationId: klasseWithItslearning.id,
        });
        const personenkontextAtKlasseWithoutItslearning: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
            rolleId: rolleWithoutItslearning.id,
            organisationId: klasseWithoutItslearning.id,
        });

        describe('when person has at least one relevant kontext', () => {
            beforeEach(() => {
                personRepoMock.findById.mockResolvedValueOnce(person);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([
                    personenkontextAtSchuleWithItslearning,
                    personenkontextAtSchuleWithoutItslearning,
                    personenkontextAtKlasseWithItslearning,
                    personenkontextAtKlasseWithoutItslearning,
                ]);
                rolleRepoMock.findByIds.mockResolvedValueOnce(
                    new Map([
                        [rolleWithItslearning.id, rolleWithItslearning],
                        [rolleWithoutItslearning.id, rolleWithoutItslearning],
                    ]),
                );
                orgaRepoMock.findByIds.mockResolvedValueOnce(
                    new Map([
                        [schuleWithItslearning.id, schuleWithItslearning],
                        [klasseWithItslearning.id, klasseWithItslearning],
                        [schuleWithoutItslearning.id, schuleWithoutItslearning],
                        [klasseWithoutItslearning.id, klasseWithoutItslearning],
                        [unknownOrgaType.id, unknownOrgaType],
                    ]),
                );
            });

            it('should create or update user', async () => {
                itslearningPersonRepoMock.createOrUpdatePerson.mockResolvedValueOnce(undefined);

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(person.id);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(itslearningPersonRepoMock.createOrUpdatePerson).toHaveBeenCalledWith(
                    {
                        id: person.id,
                        firstName: person.vorname,
                        lastName: person.familienname,
                        username: person.referrer,
                        institutionRoleType: rollenartToIMSESInstitutionRole(rolleWithItslearning.rollenart),
                    },
                    `${event.eventID}-SYNC-PERSON`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Updated person with ID ${person.id} in itslearning!`,
                );
            });

            it('should log error if creation failed', async () => {
                itslearningPersonRepoMock.createOrUpdatePerson.mockResolvedValueOnce(
                    new ItsLearningError('Error Test'),
                );

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(person.id);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(itslearningPersonRepoMock.createOrUpdatePerson).toHaveBeenCalledTimes(1);
                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not create/update person with ID ${person.id} in itslearning!`,
                );
            });

            it('should set memberships', async () => {
                itslearningPersonRepoMock.createOrUpdatePerson.mockResolvedValueOnce(undefined);
                itslearningMembershipRepoMock.setMemberships.mockResolvedValueOnce({
                    ok: true,
                    value: { deleted: 0, updated: 1 },
                } satisfies Result<SetMembershipsResult, DomainError>);

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(person.id);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(itslearningMembershipRepoMock.setMemberships).toHaveBeenCalledWith(
                    person.id,
                    expect.arrayContaining([
                        {
                            organisationId: personenkontextAtSchuleWithItslearning.organisationId,
                            role: rolleWithItslearning.rollenart,
                        },
                        {
                            organisationId: personenkontextAtKlasseWithItslearning.organisationId,
                            role: rolleWithItslearning.rollenart,
                        },
                    ]),
                    `${event.eventID}-SYNC-PERSON-MEMBERSHIPS`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Created/Updated 1 and deleted 0 memberships for person with ID ${person.id} to itslearning!`,
                );
            });

            it('should log error if setting memberships failed', async () => {
                itslearningPersonRepoMock.createOrUpdatePerson.mockResolvedValueOnce(undefined);
                itslearningMembershipRepoMock.setMemberships.mockResolvedValueOnce({
                    ok: false,
                    error: new ItsLearningError('Error Test'),
                } satisfies Result<SetMembershipsResult, DomainError>);

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(person.id);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not delete person with ID ${person.id} from itslearning!`,
                );
            });
        });

        describe('when person has no relevant kontext', () => {
            beforeEach(() => {
                personRepoMock.findById.mockResolvedValueOnce(person);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([
                    personenkontextAtSchuleWithoutItslearning,
                    personenkontextAtKlasseWithoutItslearning,
                ]);
                rolleRepoMock.findByIds.mockResolvedValueOnce(
                    new Map([[rolleWithoutItslearning.id, rolleWithoutItslearning]]),
                );
                orgaRepoMock.findByIds.mockResolvedValueOnce(
                    new Map([
                        [schuleWithItslearning.id, schuleWithItslearning],
                        [klasseWithItslearning.id, klasseWithItslearning],
                        [schuleWithoutItslearning.id, schuleWithoutItslearning],
                        [klasseWithoutItslearning.id, klasseWithoutItslearning],
                        [unknownOrgaType.id, unknownOrgaType],
                    ]),
                );
            });

            it('should delete person', async () => {
                itslearningPersonRepoMock.deletePerson.mockResolvedValueOnce(undefined);

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(person.id);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(itslearningPersonRepoMock.deletePerson).toHaveBeenCalledWith(
                    person.id,
                    `${event.eventID}-DELETE`,
                );
            });

            it('should log error if deletion failed', async () => {
                itslearningPersonRepoMock.deletePerson.mockResolvedValueOnce(new ItsLearningError('Error Test'));

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(person.id);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Could not delete person with ID ${person.id} from itslearning!`,
                );
            });
        });

        describe('invalid person', () => {
            it("should log error, if person doesn't exist", async () => {
                const personId: string = faker.string.uuid();
                personRepoMock.findById.mockResolvedValueOnce(undefined);

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(personId);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Person with ID ${personId} could not be found!`,
                );
            });

            it('should log error, if person has no username', async () => {
                const personId: string = faker.string.uuid();
                personRepoMock.findById.mockResolvedValueOnce(DoFactory.createPerson(true, { referrer: undefined }));

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(personId);
                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Person with ID ${personId} has no username!`,
                );
            });
        });

        describe('when not enabled', () => {
            it('should log info and return', async () => {
                sut.ENABLED = false;

                const event: PersonExternalSystemsSyncEvent = new PersonExternalSystemsSyncEvent(faker.string.uuid());
                await sut.personExternalSystemSyncEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `[EventID: ${event.eventID}] Not enabled, ignoring event.`,
                );
            });
        });
    });
});

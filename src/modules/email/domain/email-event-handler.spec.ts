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
import { EmailEventHandler } from './email-event-handler.js';
import { faker } from '@faker-js/faker';
import { EmailModule } from '../email.module.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import {
    ServiceProviderKategorie,
    ServiceProviderTarget,
} from '../../service-provider/domain/service-provider.enum.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EventModule, EventService } from '../../../core/eventbus/index.js';
import { EmailFactory } from './email.factory.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed-event.js';
import { RolleUpdatedEvent } from '../../../shared/events/rolle-updated.event.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { EmailAddress } from './email-address.js';
import { PersonID, RolleID } from '../../../shared/types/index.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';

function getEmail(): EmailAddress<true> {
    const fakePersonId: PersonID = faker.string.uuid();
    const fakeEmailAddressId: string = faker.string.uuid();
    return EmailAddress.construct(
        fakeEmailAddressId,
        faker.date.past(),
        faker.date.recent(),
        fakePersonId,
        faker.internet.email(),
        true,
    );
}

describe('Email Event Handler', () => {
    let app: INestApplication;

    let emailEventHandler: EmailEventHandler;
    let emailFactoryMock: DeepMocked<EmailFactory>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let dbiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                EmailModule,
                EventModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideProvider(OrganisationRepository)
            .useValue(createMock<OrganisationRepository>())
            .overrideProvider(EmailFactory)
            .useValue(createMock<EmailFactory>())
            .overrideProvider(EmailRepo)
            .useValue(createMock<EmailRepo>())
            .overrideProvider(ServiceProviderRepo)
            .useValue(createMock<ServiceProviderRepo>())
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EmailEventHandler)
            .useClass(EmailEventHandler)
            .overrideProvider(EventService)
            .useClass(EventService)
            .compile();

        emailEventHandler = module.get(EmailEventHandler);
        emailFactoryMock = module.get(EmailFactory);
        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        emailRepoMock = module.get(EmailRepo);
        rolleRepoMock = module.get(RolleRepo);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        loggerMock = module.get(ClassLogger);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    function mockEmailFactoryCreateNewReturnsEnabledEmail(fakeEmailAddress: string): void {
        // eslint-disable-next-line @typescript-eslint/require-await
        emailFactoryMock.createNew.mockImplementationOnce(async (personId: PersonID) => {
            const emailAddress: EmailAddress<false> = EmailAddress.createNew(personId, fakeEmailAddress, true);

            return {
                ok: true,
                value: emailAddress,
            };
        });
    }

    describe('handlePersonenkontextCreatedEvent', () => {
        let fakePersonId: PersonID;
        let fakeRolleId: RolleID;
        let fakeEmailAddressString: string;
        //let emailAddressId: EmailAddressID;
        let event: PersonenkontextCreatedEvent;
        let personenkontexte: Personenkontext<true>[];
        let rolle: Rolle<true>;
        let rolleMap: Map<string, Rolle<true>>;
        let sp: ServiceProvider<true>;
        let spMap: Map<string, ServiceProvider<true>>;

        beforeEach(() => {
            jest.resetAllMocks();
            fakePersonId = faker.string.uuid();
            fakeRolleId = faker.string.uuid();
            fakeEmailAddressString = faker.internet.email();
            //emailAddressId = faker.string.uuid();
            event = new PersonenkontextCreatedEvent(fakePersonId, faker.string.uuid(), faker.string.uuid());

            personenkontexte = [createMock<Personenkontext<true>>()];
            rolle = createMock<Rolle<true>>({ serviceProviderIds: [] });
            rolleMap = new Map<string, Rolle<true>>();
            rolleMap.set(fakeRolleId, rolle);
            sp = createMock<ServiceProvider<true>>({
                target: ServiceProviderTarget.EMAIL,
            });
            spMap = new Map<string, ServiceProvider<true>>();
            spMap.set(sp.id, sp);
        });

        describe('when email exists and is enabled', () => {
            it('should log matching info', async () => {
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementationOnce(async (personId: PersonID) => {
                    return new EmailAddress<true>(
                        faker.string.uuid(),
                        faker.date.past(),
                        faker.date.recent(),
                        personId,
                        faker.internet.email(),
                        true,
                    );
                });

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Existing email for personId:${fakePersonId} already enabled`,
                );
            });
        });

        describe('when email exists but is disabled and enabling is successful', () => {
            it('should log matching info', async () => {
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementationOnce(async (personId: PersonID) => {
                    return new EmailAddress<true>(
                        faker.string.uuid(),
                        faker.date.past(),
                        faker.date.recent(),
                        personId,
                        faker.internet.email(),
                        false,
                    );
                });

                const persistedEmail: EmailAddress<true> = getEmail();
                emailRepoMock.save.mockResolvedValueOnce(persistedEmail);

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Enabled and saved address:${persistedEmail.currentAddress}`,
                );
            });
        });

        describe('when email exists and but is disabled but enabling fails', () => {
            it('should log matching error', async () => {
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementationOnce(async (personId: PersonID) => {
                    return new EmailAddress<true>(
                        faker.string.uuid(),
                        faker.date.past(),
                        faker.date.recent(),
                        personId,
                        faker.internet.email(),
                        false,
                    );
                });

                emailRepoMock.save.mockResolvedValueOnce(new EmailAddressNotFoundError(fakeEmailAddressString));

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not enable email, error is requested EmailAddress with the address:${fakeEmailAddressString} was not found`,
                );
            });
        });

        describe('when email does NOT exist should create and persist a new one', () => {
            it('should log matching info', async () => {
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //no existing email is found

                const persistenceResult: EmailAddress<true> = getEmail();
                emailRepoMock.save.mockResolvedValueOnce(persistenceResult); //mock: error during saving the entity

                mockEmailFactoryCreateNewReturnsEnabledEmail(faker.internet.email());

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully persisted email with new address:${persistenceResult.currentAddress}`,
                );
            });
        });

        describe('when email does NOT exist and error occurs during creation', () => {
            it('should log matching info', async () => {
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //no existing email is found

                // eslint-disable-next-line @typescript-eslint/require-await
                emailFactoryMock.createNew.mockImplementationOnce(async (personId: PersonID) => {
                    return {
                        ok: false,
                        error: new EntityNotFoundError('Person', personId),
                    };
                });

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not create email, error is requested Person with the following ID ${fakePersonId} was not found`,
                );
            });
        });

        describe('when email does NOT exist and error occurs during persisting', () => {
            it('should log matching info', async () => {
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValueOnce(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //no existing email is found

                emailRepoMock.save.mockResolvedValueOnce(new EmailAddressNotFoundError(fakeEmailAddressString)); //mock: error during saving the entity

                // eslint-disable-next-line @typescript-eslint/require-await
                emailFactoryMock.createNew.mockImplementationOnce(async (personId: PersonID) => {
                    const emailAddress: EmailAddress<false> = EmailAddress.createNew(
                        personId,
                        faker.internet.email(),
                        true,
                    );

                    return {
                        ok: true,
                        value: emailAddress,
                    };
                });

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not persist email, error is requested EmailAddress with the address:${fakeEmailAddressString} was not found`,
                );
            });
        });
    });

    describe('handlePersonRenamedEvent', () => {
        let fakePersonId: PersonID;
        let fakeEmailAddress: string;
        let event: PersonRenamedEvent;
        let personenkontext: Personenkontext<true>;
        let rolle: Rolle<true>;
        let rollenMap: Map<string, Rolle<true>>;
        let sp: ServiceProvider<true>;
        let spMap: Map<string, ServiceProvider<true>>;
        let emailAddress: EmailAddress<true>;

        beforeEach(() => {
            fakePersonId = faker.string.uuid();
            fakeEmailAddress = faker.internet.email();
            event = new PersonRenamedEvent(fakePersonId, fakeEmailAddress);
            personenkontext = createMock<Personenkontext<true>>();
            rolle = createMock<Rolle<true>>({ id: faker.string.uuid() });
            rollenMap = new Map<string, Rolle<true>>();
            rollenMap.set(faker.string.uuid(), rolle);
            sp = createMock<ServiceProvider<true>>({
                target: ServiceProviderTarget.EMAIL,
            });
            spMap = new Map<string, ServiceProvider<true>>();
            spMap.set(sp.id, sp);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);
            serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
            emailAddress = EmailAddress.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                fakePersonId,
                fakeEmailAddress,
                true,
            );
        });

        describe('when rolle exists and service provider with kategorie email is found', () => {
            describe('when enabled email already exists and save disabling is successful', () => {
                it('should log info only', async () => {
                    dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([personenkontext]);
                    rolleRepoMock.findByIds.mockResolvedValueOnce(rollenMap);
                    serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
                    emailRepoMock.findByPerson.mockResolvedValueOnce(emailAddress);

                    emailRepoMock.save.mockResolvedValueOnce(emailAddress);

                    //mock createNewEmail
                    mockEmailFactoryCreateNewReturnsEnabledEmail(fakeEmailAddress);

                    //mock persisting new email
                    emailRepoMock.save.mockResolvedValueOnce(emailAddress);

                    await emailEventHandler.handlePersonRenamedEvent(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Received PersonRenamedEvent, personId:${event.personId}, emailAddress:${event.emailAddress}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Disabled and saved address:${emailAddress.currentAddress}`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Creating new email-address for personId:${event.personId}, due to PersonRenamedEvent`,
                    );
                });
            });

            describe('when enabled email already exists and save disabling results in error', () => {
                it('should log error', async () => {
                    dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([personenkontext]);
                    rolleRepoMock.findByIds.mockResolvedValueOnce(rollenMap);
                    serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
                    emailRepoMock.findByPerson.mockResolvedValueOnce(emailAddress);

                    emailRepoMock.save.mockResolvedValueOnce(new EmailAddressNotFoundError(fakeEmailAddress));

                    //mock createNewEmail
                    mockEmailFactoryCreateNewReturnsEnabledEmail(fakeEmailAddress);

                    //mock persisting new email
                    emailRepoMock.save.mockResolvedValueOnce(emailAddress);

                    await emailEventHandler.handlePersonRenamedEvent(event);

                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Received PersonRenamedEvent, personId:${event.personId}, emailAddress:${event.emailAddress}`,
                    );
                    expect(loggerMock.error).toHaveBeenCalledWith(
                        `Could not disable email, error is requested EmailAddress with the address:${fakeEmailAddress} was not found`,
                    );
                    expect(loggerMock.info).toHaveBeenCalledWith(
                        `Creating new email-address for personId:${event.personId}, due to PersonRenamedEvent`,
                    );
                });
            });
        });
    });

    describe('handlePersonenkontextDeletedEvent', () => {
        describe('when rolle exists and service provider with kategorie email is found', () => {
            it('should execute without errors', async () => {
                const event: PersonenkontextDeletedEvent = new PersonenkontextDeletedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                const rolle: Rolle<true> = createMock<Rolle<true>>({ serviceProviderIds: [] });
                const sp: ServiceProvider<true> = createMock<ServiceProvider<true>>({
                    kategorie: ServiceProviderKategorie.EMAIL,
                });
                const spMap: Map<string, ServiceProvider<true>> = new Map<string, ServiceProvider<true>>();
                spMap.set(sp.id, sp);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                const result: void = await emailEventHandler.handlePersonenkontextDeletedEvent(event);

                expect(result).toBeUndefined();
            });
        });

        describe('when rolle does NOT exists', () => {
            it('should execute without errors', async () => {
                const event: PersonenkontextDeletedEvent = new PersonenkontextDeletedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(undefined);
                const result: void = await emailEventHandler.handlePersonenkontextDeletedEvent(event);

                expect(result).toBeUndefined();
            });
        });
    });

    describe('handlePersonDeletedEvent', () => {
        let personId: string;
        let emailAddress: string;
        let event: PersonDeletedEvent;

        beforeEach(() => {
            personId = faker.string.uuid();
            emailAddress = faker.internet.email();
            event = new PersonDeletedEvent(personId, emailAddress);
        });

        describe('when deletion is successful', () => {
            it('should log info', async () => {
                await emailEventHandler.handlePersonDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`Successfully deactivated email-address:${emailAddress}`);
            });
        });

        describe('when event does not provide email-address', () => {
            it('should log info about that', async () => {
                event = new PersonDeletedEvent(personId, undefined);
                await emailEventHandler.handlePersonDeletedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Cannot deactivate email-address, person did not have an email-address`,
                );
            });
        });

        describe('when email-address for deletion cannot be found', () => {
            it('should log error', async () => {
                emailRepoMock.deactivateEmailAddress.mockResolvedValueOnce(new EmailAddressNotFoundError());
                await emailEventHandler.handlePersonDeletedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Deactivation of email-address:${event.emailAddress} failed`,
                );
            });
        });
    });

    describe('handleRolleUpdatedEvent', () => {
        let fakeRolleId: string;
        let fakePersonId: string;
        let personenkontexte: Personenkontext<true>[] = [];
        let event: RolleUpdatedEvent;
        let sp: ServiceProvider<true>;
        let spMap: Map<string, ServiceProvider<true>>;
        let rolle: Rolle<true>;
        let rolleMap: Map<string, Rolle<true>>;

        beforeEach(() => {
            fakeRolleId = faker.string.uuid();
            personenkontexte = [
                createMock<Personenkontext<true>>({ personId: fakePersonId }),
                createMock<Personenkontext<true>>({ personId: fakePersonId }),
                createMock<Personenkontext<true>>({ personId: faker.string.uuid() }),
            ];
            event = new RolleUpdatedEvent(fakeRolleId, faker.helpers.enumValue(RollenArt), [], [], []);
            rolle = createMock<Rolle<true>>({ serviceProviderIds: [] });
            rolleMap = new Map<string, Rolle<true>>();
            rolleMap.set(fakeRolleId, rolle);
            sp = createMock<ServiceProvider<true>>({
                target: ServiceProviderTarget.EMAIL,
            });
            spMap = new Map<string, ServiceProvider<true>>();
            spMap.set(sp.id, sp);
        });

        describe('when rolle is updated', () => {
            it('should log info', async () => {
                dbiamPersonenkontextRepoMock.findByRolle.mockResolvedValueOnce(personenkontexte);

                //in the following enabling, persisting and so on is mocked for all PKs, testing handlePerson-method is done in other test cases
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValue(personenkontexte);
                rolleRepoMock.findByIds.mockResolvedValue(rolleMap);
                serviceProviderRepoMock.findByIds.mockResolvedValue(spMap);

                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementation(async (personId: PersonID) => {
                    return new EmailAddress<true>(
                        faker.string.uuid(),
                        faker.date.past(),
                        faker.date.recent(),
                        personId,
                        faker.internet.email(),
                        false,
                    );
                });

                const persistedEmail: EmailAddress<true> = getEmail();
                emailRepoMock.save.mockResolvedValue(persistedEmail);

                await emailEventHandler.handleRolleUpdatedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`RolleUpdatedEvent affects:2 persons`);
            });
        });

        describe('when rolle is updated but person should not get an email-address by event', () => {
            it('should log info', async () => {
                dbiamPersonenkontextRepoMock.findByRolle.mockResolvedValueOnce(personenkontexte);

                //mock that no email-address is necessary for person to test handlePerson
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValue([]);
                rolleRepoMock.findByIds.mockResolvedValue(new Map<string, Rolle<true>>());
                serviceProviderRepoMock.findByIds.mockResolvedValue(new Map<string, ServiceProvider<true>>());

                await emailEventHandler.handleRolleUpdatedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`Person with id:${fakePersonId} does not need an email`);
            });
        });
    });
});

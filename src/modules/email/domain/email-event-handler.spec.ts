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
import { EmailGeneratorService } from './email-generator.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderKategorie } from '../../service-provider/domain/service-provider.enum.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EventModule, EventService } from '../../../core/eventbus/index.js';
import { EmailFactory } from './email.factory.js';
import { Email } from './email.js';
import { EmailID, PersonID, RolleID } from '../../../shared/types/index.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddress } from './email-address.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';

function getEmail(emaiGeneratorService: EmailGeneratorService, personRepository: PersonRepository): Email<true, true> {
    const fakeEmailId: EmailID = faker.string.uuid();
    return Email.construct(
        fakeEmailId,
        faker.date.past(),
        faker.date.recent(),
        faker.string.uuid(),
        [new EmailAddress<true>(fakeEmailId, faker.internet.email(), true)],
        emaiGeneratorService,
        personRepository,
    );
}

describe('Email Event Handler', () => {
    let app: INestApplication;

    let emailEventHandler: EmailEventHandler;
    let emailFactoryMock: DeepMocked<EmailFactory>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let loggerMock: DeepMocked<ClassLogger>;
    let emailGeneratorServiceMock: DeepMocked<EmailGeneratorService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;

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
            .overrideProvider(EmailGeneratorService)
            .useValue(createMock<EmailGeneratorService>())
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
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EmailEventHandler)
            .useClass(EmailEventHandler)
            .overrideProvider(EventService)
            .useClass(EventService)
            .compile();

        emailEventHandler = module.get(EmailEventHandler);
        emailFactoryMock = module.get(EmailFactory);
        emailRepoMock = module.get(EmailRepo);
        rolleRepoMock = module.get(RolleRepo);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        loggerMock = module.get(ClassLogger);
        emailGeneratorServiceMock = module.get(EmailGeneratorService);
        personRepositoryMock = module.get(PersonRepository);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('asyncPersonenkontextCreatedEventHandler', () => {
        let rolle: Rolle<true>;
        let sp: ServiceProvider<true>;
        let spMap: Map<string, ServiceProvider<true>>;

        beforeEach(() => {
            rolle = createMock<Rolle<true>>({ serviceProviderIds: [] });
            sp = createMock<ServiceProvider<true>>({
                kategorie: ServiceProviderKategorie.EMAIL,
            });
            spMap = new Map<string, ServiceProvider<true>>();
            spMap.set(sp.id, sp);
        });

        describe('when existing email is found', () => {
            it('should enable existing email', async () => {
                const fakePersonId: PersonID = faker.string.uuid();
                const emailId: EmailID = faker.string.uuid();
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    fakePersonId,
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                const emailAddresses: EmailAddress<true>[] = [
                    new EmailAddress<true>(emailId, faker.internet.email(), true),
                ];
                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementationOnce(async (personId: PersonID) => {
                    const emailMock: DeepMocked<Email<true, true>> = createMock<Email<true, true>>({
                        emailAddresses: emailAddresses,
                        personId: personId,
                    });
                    // eslint-disable-next-line @typescript-eslint/require-await
                    emailMock.enable.mockImplementationOnce(async () => {
                        return {
                            ok: true,
                            value: createMock<Email<true, true>>({
                                get currentAddress(): Option<string> {
                                    return 'test@schule-sh.de';
                                },
                                id: emailId,
                                emailAddresses: emailAddresses,
                            }),
                        };
                    });

                    return emailMock;
                });
                emailRepoMock.save.mockResolvedValueOnce(getEmail(emailGeneratorServiceMock, personRepositoryMock)); //mock email was persisted successfully

                await emailEventHandler.asyncPersonenkontextCreatedEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`Enabling existing email for person:${fakePersonId}`);
            });
        });

        describe('when existing email is found but enabling results in error', () => {
            it('should log error', async () => {
                const fakePersonId: PersonID = faker.string.uuid();
                const emailId: EmailID = faker.string.uuid();
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    fakePersonId,
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                const emailAddresses: EmailAddress<true>[] = [
                    new EmailAddress<true>(emailId, faker.internet.email(), true),
                ];
                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementationOnce(async (personId: PersonID) => {
                    const emailMock: DeepMocked<Email<true, true>> = createMock<Email<true, true>>({
                        emailAddresses: emailAddresses,
                        personId: personId,
                    });
                    // eslint-disable-next-line @typescript-eslint/require-await
                    emailMock.enable.mockImplementationOnce(async () => {
                        return {
                            ok: false,
                            error: new EmailAddressNotFoundError(),
                        };
                    });

                    return emailMock;
                });

                await emailEventHandler.asyncPersonenkontextCreatedEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not re-enable email, error is requested EmailAddress with the address:address was not found`,
                );
            });
        });

        describe('when rolle exists and service provider with kategorie email is found', () => {
            it('should execute without errors', async () => {
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //mock: no existing email is found -> create a new address

                emailFactoryMock.createNew.mockImplementationOnce((personId: PersonID) => {
                    const emailMock: DeepMocked<Email<false, false>> = createMock<Email<false, false>>({
                        emailAddresses: [new EmailAddress<false>(undefined, faker.internet.email(), true)],
                        personId: personId,
                    });
                    const emailAddress: EmailAddress<false> = createMock<EmailAddress<false>>({
                        address: 'test@schule-sh.de',
                    });
                    // eslint-disable-next-line @typescript-eslint/require-await
                    emailMock.enable.mockImplementationOnce(async () => {
                        return {
                            ok: true,
                            value: createMock<Email<false, true>>({
                                get currentAddress(): Option<string> {
                                    return 'test@schule-sh.de';
                                },
                                emailAddresses: [emailAddress],
                            }),
                        };
                    });

                    return emailMock;
                });

                const fakePersistedEmail: Email<true, true> = getEmail(emailGeneratorServiceMock, personRepositoryMock);
                emailRepoMock.save.mockResolvedValueOnce(fakePersistedEmail); //mock email was persisted successfully

                await emailEventHandler.asyncPersonenkontextCreatedEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Successfully persisted email with new address:${fakePersistedEmail.currentAddress}`,
                );
            });
        });

        describe('when rolle does NOT exist', () => {
            it('should log error', async () => {
                const rolleId: RolleID = faker.string.uuid();
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    rolleId,
                );

                rolleRepoMock.findById.mockResolvedValueOnce(undefined);
                await emailEventHandler.asyncPersonenkontextCreatedEventHandler(event);
                expect(loggerMock.error).toHaveBeenCalledWith(`Rolle id:${rolleId} does NOT exist`);
            });
        });

        describe('when activation of email returns error', () => {
            it('should log error', async () => {
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(createMock<Rolle<true>>());
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                emailFactoryMock.createNew.mockImplementationOnce((personId: PersonID) => {
                    const emailMock: DeepMocked<Email<false, false>> = createMock<Email<false, false>>({
                        personId: personId,
                    });
                    // eslint-disable-next-line @typescript-eslint/require-await
                    emailMock.enable.mockImplementationOnce(async () => {
                        return {
                            ok: false,
                            error: new EmailInvalidError(),
                        };
                    });

                    return emailMock;
                });
                emailRepoMock.save.mockResolvedValueOnce(createMock<Email<true, true>>()); //mock email was persisted successfully

                await emailEventHandler.asyncPersonenkontextCreatedEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(`Could not create email, error is Email is invalid`);
            });
        });
    });

    describe('asyncPersonenkontextDeletedEventHandler', () => {
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

                const result: void = await emailEventHandler.asyncPersonenkontextDeletedEventHandler(event);

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
                const result: void = await emailEventHandler.asyncPersonenkontextDeletedEventHandler(event);

                expect(result).toBeUndefined();
            });
        });
    });

    describe('asyncPersonDeletedEventHandler', () => {
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
                emailRepoMock.deleteById.mockResolvedValueOnce(true);

                await emailEventHandler.asyncPersonDeletedEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`Successfully deactivated email-address:${emailAddress}`);
            });
        });

        describe('when event does not provide email-address', () => {
            it('should log info about that', async () => {
                event = new PersonDeletedEvent(personId, undefined);
                await emailEventHandler.asyncPersonDeletedEventHandler(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Cannot deactivate email-address, person did not have an email-address`,
                );
            });
        });

        describe('when email-address for deletion cannot be found', () => {
            it('should log error', async () => {
                emailRepoMock.deactivateEmailAddress.mockResolvedValueOnce(new EmailAddressNotFoundError());
                await emailEventHandler.asyncPersonDeletedEventHandler(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Deactivation of email-address:${event.emailAddress} failed`,
                );
            });
        });
    });
});

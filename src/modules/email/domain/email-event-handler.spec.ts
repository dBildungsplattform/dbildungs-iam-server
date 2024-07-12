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
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
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
import { EmailAddressID, PersonID, RolleID } from '../../../shared/types/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { Email } from './email.js';
import { EmailAddress } from './email-address.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';

function getEmail(): Email {
    const fakePersonId: PersonID = faker.string.uuid();
    const fakeEmailAddressId: string = faker.string.uuid();
    return Email.construct(
        fakePersonId,
        new EmailAddress<boolean>(fakeEmailAddressId, undefined, undefined, fakePersonId, faker.internet.email(), true),
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

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('handlePersonenkontextCreatedEvent', () => {
        let rolle: Rolle<true>;
        let sp: ServiceProvider<true>;
        let spMap: Map<string, ServiceProvider<true>>;

        beforeEach(() => {
            rolle = createMock<Rolle<true>>({ serviceProviderIds: [] });
            sp = createMock<ServiceProvider<true>>({
                target: ServiceProviderTarget.EMAIL,
            });
            spMap = new Map<string, ServiceProvider<true>>();
            spMap.set(sp.id, sp);
        });

        describe('when existing email is found', () => {
            it('should enable existing email', async () => {
                const fakePersonId: PersonID = faker.string.uuid();
                const emailAddressId: EmailAddressID = faker.string.uuid();
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    fakePersonId,
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);

                const emailAddress: EmailAddress<true> = new EmailAddress<true>(
                    emailAddressId,
                    faker.date.past(),
                    faker.date.recent(),
                    fakePersonId,
                    faker.internet.email(),
                    true,
                );
                // eslint-disable-next-line @typescript-eslint/require-await
                emailRepoMock.findByPerson.mockImplementationOnce(async (personId: PersonID) => {
                    const emailMock: DeepMocked<Email> = createMock<Email>({
                        emailAddress: emailAddress,
                        personId: personId,
                    });
                    emailMock.enable.mockImplementationOnce(() => {
                        return true;
                    });

                    return emailMock;
                });
                emailRepoMock.save.mockResolvedValueOnce(getEmail()); //mock email was persisted successfully

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(`Existing email found for personId:${event.personId}`);
            });
        });

        describe('when rolle exists and service provider with target email is found', () => {
            it('should execute without errors', async () => {
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //mock: no existing email is found -> create a new address

                // eslint-disable-next-line @typescript-eslint/require-await
                emailFactoryMock.createNew.mockImplementationOnce(async (personId: PersonID) => {
                    const emailMock: DeepMocked<Email> = createMock<Email>({
                        emailAddress: EmailAddress.createNew(personId, faker.internet.email(), true),
                        personId: personId,
                    });
                    emailMock.enable.mockImplementationOnce(() => {
                        return true;
                    });

                    return {
                        ok: true,
                        value: emailMock,
                    };
                });

                const fakePersistedEmail: Email = getEmail();
                emailRepoMock.save.mockResolvedValueOnce(fakePersistedEmail); //mock email was persisted successfully

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

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
                await emailEventHandler.handlePersonenkontextCreatedEvent(event);
                expect(loggerMock.error).toHaveBeenCalledWith(`Rolle id:${rolleId} does NOT exist`);
            });
        });

        describe('when creating new email throws error in factory', () => {
            it('should log error', async () => {
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //mock: no existing email is found -> create a new address

                // eslint-disable-next-line @typescript-eslint/require-await
                emailFactoryMock.createNew.mockImplementationOnce(async (personId: PersonID) => {
                    return {
                        ok: false,
                        error: new EntityNotFoundError('Person', personId),
                    };
                });

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not create email, error is requested Person with the following ID ${event.personId} was not found`,
                );
            });
        });

        describe('when creating new email throws error in repository', () => {
            it('should log error', async () => {
                const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(spMap);
                emailRepoMock.findByPerson.mockResolvedValueOnce(undefined); //mock: no existing email is found -> create a new address
                emailRepoMock.save.mockResolvedValueOnce(new EmailAddressNotFoundError()); //mock: error during saving the entity

                // eslint-disable-next-line @typescript-eslint/require-await
                emailFactoryMock.createNew.mockImplementationOnce(async (personId: PersonID) => {
                    const emailMock: DeepMocked<Email> = createMock<Email>({
                        emailAddress: EmailAddress.createNew(personId, faker.internet.email(), true),
                        personId: personId,
                    });
                    emailMock.enable.mockImplementationOnce(() => {
                        return true;
                    });

                    return {
                        ok: true,
                        value: emailMock,
                    };
                });

                await emailEventHandler.handlePersonenkontextCreatedEvent(event);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Could not create email, error is requested EmailAddress with the address:address was not found`,
                );
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
});

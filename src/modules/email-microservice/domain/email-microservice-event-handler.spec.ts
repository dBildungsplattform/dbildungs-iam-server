import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils';
import { EventModule } from '../../../core/eventbus';
import { ClassLogger } from '../../../core/logging/class-logger';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event';
import { Rolle } from '../../rolle/domain/rolle';
import { RollenArt } from '../../rolle/domain/rolle.enums';
import { RolleRepo } from '../../rolle/repo/rolle.repo';
import { ServiceProvider } from '../../service-provider/domain/service-provider';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum';
import { EmailMicroserviceModule } from '../email-microservice.module';
import { EmailMicroserviceEventHandler } from './email-microservice-event-handler';
import { EmailResolverService } from './email-resolver.service';

type SetEmailParams = Parameters<EmailResolverService['setEmailForSpshPerson']>[0];

describe('EmailMicroserviceEventHandler', () => {
    let app: INestApplication;
    let module: TestingModule;

    let sut: EmailMicroserviceEventHandler;
    let logger: ClassLogger;
    let emailResolverService: DeepMocked<EmailResolverService>;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                EmailMicroserviceModule,
                ConfigTestModule,
                EventModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EmailResolverService)
            .useValue(createMock<EmailResolverService>())
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .compile();

        sut = module.get(EmailMicroserviceEventHandler);
        logger = module.get(ClassLogger);
        emailResolverService = module.get(EmailResolverService);
        rolleRepo = module.get(RolleRepo);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should log and call emailResolverService when microservice is enabled', async () => {
        const mockServiceProviderId: string = faker.string.uuid();
        const params: SetEmailParams = {
            spshPersonId: faker.string.uuid(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            spshServiceProviderId: mockServiceProviderId,
        };
        const mockEvent: PersonenkontextUpdatedEvent = createMock<PersonenkontextUpdatedEvent>({
            person: {
                id: params.spshPersonId,
                vorname: params.firstName,
                familienname: params.lastName,
                username: 'testuser',
            },
            currentKontexte: [
                {
                    id: 'pk1',
                    rolleId: 'r1',
                    rolle: RollenArt.LERN,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [ServiceProviderSystem.EMAIL],
                },
            ],
            removedKontexte: [],
            newKontexte: [],
            createdAt: new Date(),
            eventID: '',
        });
        const mockRolle: Rolle<true> = createMock<Rolle<true>>({
            id: faker.string.uuid(),
            serviceProviderData: [
                createMock<ServiceProvider<true>>({
                    id: mockServiceProviderId,
                    externalSystem: ServiceProviderSystem.EMAIL,
                }),
            ],
        });
        emailResolverService.shouldUseEmailMicroservice.mockReturnValueOnce(true);

        jest.spyOn(rolleRepo, 'findByIds').mockResolvedValue(new Map([['r1', mockRolle]]));

        await sut.handlePersonenkontextUpdatedEvent(mockEvent);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received PersonenkontextUpdatedEvent'));
        expect(emailResolverService.setEmailForSpshPerson).toHaveBeenCalledWith(params);
    });

    it('should not call emailResolverService when microservice is disabled', async () => {
        const mockEvent: PersonenkontextUpdatedEvent = createMock<PersonenkontextUpdatedEvent>({
            person: {
                id: faker.string.uuid(),
                vorname: faker.person.firstName(),
                familienname: faker.person.lastName(),
                username: faker.internet.userName(),
            },
            newKontexte: [{}, {}],
            removedKontexte: [{}],
            currentKontexte: [{}],
        });
        emailResolverService.shouldUseEmailMicroservice.mockReturnValueOnce(false);

        await sut.handlePersonenkontextUpdatedEvent(mockEvent);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received PersonenkontextUpdatedEvent'));
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Ignoring Event for'));
        expect(emailResolverService.setEmailForSpshPerson).not.toHaveBeenCalled();
    });

    it('should log and return early when no email service provider is found', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockRolleId: string = 'r1';
        const mockEvent: PersonenkontextUpdatedEvent = createMock<PersonenkontextUpdatedEvent>({
            person: {
                id: mockPersonId,
                vorname: faker.person.firstName(),
                familienname: faker.person.lastName(),
                username: 'testuser',
            },
            currentKontexte: [
                {
                    id: 'pk1',
                    rolleId: mockRolleId,
                    rolle: RollenArt.LEHR,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ],
            removedKontexte: [],
            newKontexte: [],
            createdAt: new Date(),
            eventID: '',
        });
        const mockRolle: Rolle<true> = createMock<Rolle<true>>({
            id: mockRolleId,
            serviceProviderData: [
                createMock<ServiceProvider<true>>({
                    id: faker.string.uuid(),
                    externalSystem: ServiceProviderSystem.NONE,
                }),
            ],
        });

        emailResolverService.shouldUseEmailMicroservice.mockReturnValueOnce(true);

        jest.spyOn(rolleRepo, 'findByIds').mockResolvedValue(new Map([[mockRolleId, mockRolle]]));

        await sut.handlePersonenkontextUpdatedEvent(mockEvent);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received PersonenkontextUpdatedEvent'));
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining(`No email service provider found for personId:${mockPersonId}`),
        );
        expect(emailResolverService.setEmailForSpshPerson).not.toHaveBeenCalled();
    });

    it('should resolve correct email service provider and call setEmailForSpshPerson', async () => {
        const mockPersonId: string = faker.string.uuid();
        const mockServiceProviderId: string = faker.string.uuid();
        const mockEvent: PersonenkontextUpdatedEvent = createMock<PersonenkontextUpdatedEvent>({
            person: {
                id: mockPersonId,
                username: 'testuser',
                vorname: 'Max',
                familienname: 'Mustermann',
            },
            currentKontexte: [
                {
                    id: 'pk1',
                    rolleId: 'r1',
                    rolle: RollenArt.LERN,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ],
            removedKontexte: [
                {
                    id: 'pk1',
                    rolleId: 'r1',
                    rolle: RollenArt.LERN,
                    orgaId: faker.string.uuid(),
                    isItslearningOrga: false,
                    serviceProviderExternalSystems: [],
                },
            ],
            newKontexte: [],
            createdAt: new Date(),
            eventID: '',
        });
        const mockRolle: Rolle<true> = createMock<Rolle<true>>({
            id: faker.string.uuid(),
            serviceProviderData: [
                createMock<ServiceProvider<true>>({
                    id: mockServiceProviderId,
                    externalSystem: ServiceProviderSystem.EMAIL,
                }),
            ],
        });

        jest.spyOn(rolleRepo, 'findByIds').mockResolvedValue(new Map([['r1', mockRolle]]));

        const setEmailSpy: jest.SpyInstance = jest
            .spyOn(emailResolverService, 'setEmailForSpshPerson')
            .mockResolvedValue();

        jest.spyOn(emailResolverService, 'shouldUseEmailMicroservice').mockReturnValue(true);

        await sut.handlePersonenkontextUpdatedEvent(mockEvent);
        expect(setEmailSpy).toHaveBeenCalledWith({
            spshPersonId: mockPersonId,
            firstName: 'Max',
            lastName: 'Mustermann',
            spshServiceProviderId: mockServiceProviderId,
        });
    });
});

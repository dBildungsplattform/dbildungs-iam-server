import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils';
import { EventModule } from '../../../core/eventbus';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service';
import { ClassLogger } from '../../../core/logging/class-logger';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event';
import { EmailResolverService } from '../email-resolve-service/email-resolver.service';
import { EmailMicroserviceEventHandler } from './email-microservice-event-handler';

describe('EmailMicroserviceEventHandler', () => {
    let app: INestApplication;

    let sut: EmailMicroserviceEventHandler;
    let logger: ClassLogger;
    let emailResolverService: EmailResolverService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                EventModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [
                EmailMicroserviceEventHandler,
                ClassLogger,
                EmailResolverService,
                EventRoutingLegacyKafkaService,
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .overrideProvider(EmailResolverService)
            .useValue(createMock<EmailResolverService>())
            .overrideProvider(EventRoutingLegacyKafkaService)
            .useValue(createMock<EventRoutingLegacyKafkaService>())
            .compile();

        sut = module.get(EmailMicroserviceEventHandler);
        logger = module.get(ClassLogger);
        emailResolverService = module.get(EmailResolverService);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should log and call emailResolverService when microservice is enabled', async () => {
        const mockEvent: PersonenkontextUpdatedEvent = createMock<PersonenkontextUpdatedEvent>({
            person: { id: faker.string.uuid(), vorname: faker.person.firstName(), familienname: faker.person.lastName(), username: faker.internet.userName() },
            newKontexte: [],
            removedKontexte: [],
        });

        await sut.handlePersonenkontextUpdatedEvent(mockEvent);

        expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Received PersonenkontextUpdatedEvent')
        );
        expect(logger.info).toHaveBeenCalledWith(
        'Handle PersonenkontextUpdatedEvent in new Microservice'
        );
        expect(emailResolverService.setEmailAddressForPerson).toHaveBeenCalledWith(
        mockEvent.person,
        mockEvent.removedKontexte
        );
    });

    it('should not call emailResolverService when microservice is disabled', async () => {
         const mockEvent: PersonenkontextUpdatedEvent = createMock<PersonenkontextUpdatedEvent>({
            person: { id: faker.string.uuid(), vorname: faker.person.firstName(), familienname: faker.person.lastName(), username: faker.internet.userName() },
            newKontexte: [{}, {}],
            removedKontexte: [{}],
        });

        await sut.handlePersonenkontextUpdatedEvent(mockEvent);

        expect(emailResolverService.setEmailAddressForPerson).not.toHaveBeenCalled();
    });
});

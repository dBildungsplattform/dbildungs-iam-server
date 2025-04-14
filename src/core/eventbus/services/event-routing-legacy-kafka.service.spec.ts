import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { EventRoutingLegacyKafkaService } from './event-routing-legacy-kafka.service.js';
import { EventService } from './event.service.js';
import { KafkaEventService } from './kafka-event.service.js';
import { LoggingTestModule } from '../../../../test/utils/index.js';
import { BaseEvent } from '../../../shared/events/base-event.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';

describe('EventRoutingLegacyKafkaService', () => {
    let sut: EventRoutingLegacyKafkaService;
    let eventServiceMock: DeepMocked<EventService>;
    let kafkaEventServiceMock: DeepMocked<KafkaEventService>;
    let configServiceMock: DeepMocked<ConfigService>;

    let module: TestingModule;

    async function setupModule(kafkaEnabled: boolean = false): Promise<void> {
        configServiceMock = createMock<ConfigService>();
        configServiceMock.get.mockReturnValue({ ENABLED: kafkaEnabled });

        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                EventRoutingLegacyKafkaService,
                { provide: EventService, useValue: createMock<EventService>() },
                { provide: KafkaEventService, useValue: createMock<KafkaEventService>() },
                { provide: ConfigService, useValue: configServiceMock },
            ],
        }).compile();

        await module.init();

        sut = module.get(EventRoutingLegacyKafkaService);
        eventServiceMock = module.get(EventService);
        kafkaEventServiceMock = module.get(KafkaEventService);
    }

    afterEach(async () => {
        jest.resetAllMocks();
        if (module) await module.close();
    });

    it('should be defined', async () => {
        await setupModule();
        expect(sut).toBeDefined();
    });

    describe('publish', () => {
        it('should publish to kafka when kafka is enabled and kafka event is provided', async () => {
            await setupModule(true);

            const legacyEvent: DeepMocked<BaseEvent> = createMock<BaseEvent>();
            const kafkaEvent: DeepMocked<KafkaEvent> = createMock<KafkaEvent>();

            await sut.publish(legacyEvent, kafkaEvent);

            expect(kafkaEventServiceMock.publish).toHaveBeenCalledWith(kafkaEvent);
            expect(eventServiceMock.publish).not.toHaveBeenCalled();
        });

        it('should publish to legacy event service when kafka is disabled', async () => {
            await setupModule(false);

            const legacyEvent: DeepMocked<BaseEvent> = createMock<BaseEvent>();
            const kafkaEvent: DeepMocked<KafkaEvent> = createMock<KafkaEvent>();

            await sut.publish(legacyEvent, kafkaEvent);

            expect(kafkaEventServiceMock.publish).not.toHaveBeenCalled();
            expect(eventServiceMock.publish).toHaveBeenCalledWith(legacyEvent);
        });

        it('should publish to legacy event service when kafka event is not provided', async () => {
            await setupModule(true);

            const legacyEvent: DeepMocked<BaseEvent> = createMock<BaseEvent>();

            await sut.publish(legacyEvent);

            expect(kafkaEventServiceMock.publish).not.toHaveBeenCalled();
            expect(eventServiceMock.publish).toHaveBeenCalledWith(legacyEvent);
        });
    });
});

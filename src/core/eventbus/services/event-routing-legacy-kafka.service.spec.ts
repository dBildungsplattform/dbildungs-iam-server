import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { EventRoutingLegacyKafkaService } from './event-routing-legacy-kafka.service.js';
import { EventService } from './event.service.js';
import { KafkaEventService } from './kafka-event.service.js';
import { LoggingTestModule } from '../../../../test/utils/index.js';
import { BaseEvent } from '../../../shared/events/base-event.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';
import { ClassLogger } from '../../logging/class-logger.js';

function flushPromises(): Promise<void> {
    return new Promise((resolve: (value: void | PromiseLike<void>) => void) => setImmediate(resolve));
}

describe('EventRoutingLegacyKafkaService', () => {
    let sut: EventRoutingLegacyKafkaService;
    let eventServiceMock: DeepMocked<EventService>;
    let kafkaEventServiceMock: DeepMocked<KafkaEventService>;
    let configServiceMock: DeepMocked<ConfigService>;
    let logger: DeepMocked<ClassLogger>;
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
        logger = module.get(ClassLogger);
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
            kafkaEventServiceMock.publish.mockResolvedValue(undefined);

            sut.publish(legacyEvent, kafkaEvent);
            await flushPromises();

            expect(kafkaEventServiceMock.publish).toHaveBeenCalledWith(kafkaEvent);
            expect(eventServiceMock.publish).not.toHaveBeenCalled();
        });

        it('should publish to legacy event service when kafka is disabled', async () => {
            await setupModule(false);

            const legacyEvent: DeepMocked<BaseEvent> = createMock<BaseEvent>();
            const kafkaEvent: DeepMocked<KafkaEvent> = createMock<KafkaEvent>();

            sut.publish(legacyEvent, kafkaEvent);

            expect(kafkaEventServiceMock.publish).not.toHaveBeenCalled();
            expect(eventServiceMock.publish).toHaveBeenCalledWith(legacyEvent);
        });

        it('should publish to legacy event service when kafka event is not provided', async () => {
            await setupModule(true);

            const legacyEvent: DeepMocked<BaseEvent> = createMock<BaseEvent>();

            sut.publish(legacyEvent);

            expect(kafkaEventServiceMock.publish).not.toHaveBeenCalled();
            expect(eventServiceMock.publish).toHaveBeenCalledWith(legacyEvent);
        });

        it('should log error if publish throws error', async () => {
            await setupModule(true);

            const legacyEvent: DeepMocked<BaseEvent> = createMock<BaseEvent>();
            const kafkaEvent: DeepMocked<KafkaEvent> = createMock<KafkaEvent>();

            const error: Error = new Error('Kafka publish failed');
            kafkaEventServiceMock.publish.mockRejectedValue(error);

            sut.publish(legacyEvent, kafkaEvent);
            await flushPromises();

            expect(kafkaEventServiceMock.publish).toHaveBeenCalledWith(kafkaEvent);
            expect(eventServiceMock.publish).not.toHaveBeenCalled();
            expect(logger.logUnknownAsError).toHaveBeenCalled();
        });
    });

    it('should set kafkaEnabled to false when kafkaConfig is undefined', async () => {
        configServiceMock = createMock<ConfigService>();
        configServiceMock.get.mockReturnValue(undefined); // Simulate undefined kafkaConfig

        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                EventRoutingLegacyKafkaService,
                { provide: EventService, useValue: createMock<EventService>() },
                { provide: KafkaEventService, useValue: createMock<KafkaEventService>() },
                { provide: ConfigService, useValue: configServiceMock },
            ],
        }).compile();

        sut = module.get(EventRoutingLegacyKafkaService);

        // @ts-expect-error - accessing private field for testing
        expect(sut.kafkaEnabled).toBe(false);

        await module.close();
    });
});

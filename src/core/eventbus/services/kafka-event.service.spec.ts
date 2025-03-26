import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TestingModule, Test } from '@nestjs/testing';
import { LoggingTestModule } from '../../../../test/utils/index.js';
import { BaseEvent } from '../../../shared/events/index.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { KafkaEventService } from './kafka-event.service.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../../shared/config/kafka.config.js';
import {
    Kafka,
    Consumer,
    Producer,
    KafkaMessage,
    EachMessageHandler,
    ConsumerRunConfig,
    EachMessagePayload,
} from 'kafkajs';
import { KafkaPersonCreatedEvent } from '../../../shared/events/kafka-person-created.event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KAFKA_INSTANCE } from '../kafka-client-provider.js';
import { FeatureFlagConfig } from '../../../shared/config/featureflag.config.js';

class TestEvent extends BaseEvent implements KafkaEvent {
    public constructor() {
        super();
    }

    public getPersonID(): string {
        return 'test';
    }
}

describe('KafkaEventService', () => {
    let module: TestingModule;
    let sut: KafkaEventService;
    let logger: DeepMocked<ClassLogger>;
    let configService: DeepMocked<ConfigService>;
    let kafka: DeepMocked<Kafka>;
    let consumer: DeepMocked<Consumer>;
    let producer: DeepMocked<Producer>;

    beforeAll(async () => {
        configService = createMock<ConfigService>();
        configService.getOrThrow.mockReturnValue({
            BROKER: 'broker',
            GROUP_ID: 'groupId',
            SESSION_TIMEOUT: 30000,
            HEARTBEAT_INTERVAL: 3000,
            TOPIC_PREFIX: 'prefix.',
            USER_TOPIC: 'user-topic',
        } as KafkaConfig);

        producer = createMock<Producer>();
        consumer = createMock<Consumer>({
            run: jest.fn(),
        });
        kafka = createMock<Kafka>({
            producer: jest.fn(() => producer),
            consumer: jest.fn(() => consumer),
        });

        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                KafkaEventService,
                { provide: ConfigService, useValue: configService },
                { provide: KAFKA_INSTANCE, useValue: kafka },
            ],
        }).compile();

        sut = module.get(KafkaEventService);
        logger = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should initialize Kafka connections on module init', async () => {
        await sut.onModuleInit();

        expect(consumer.connect).toHaveBeenCalled();
        expect(consumer.subscribe).toHaveBeenCalledWith({
            topic: 'prefix.user-topic',
            fromBeginning: true,
        });
        expect(producer.connect).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Connecting to Kafka');
    });

    it('should disconnect Kafka connections on module destroy', async () => {
        await sut.onModuleDestroy();

        expect(consumer.disconnect).toHaveBeenCalled();
        expect(producer.disconnect).toHaveBeenCalled();
    });

    it('should handle message correctly', async () => {
        const message: DeepMocked<KafkaMessage> = createMock<KafkaMessage>({
            key: Buffer.from('test'),
            value: Buffer.from(JSON.stringify(new TestEvent())),
            headers: { eventKey: 'user.created' },
        });

        const handler: jest.Mock = jest.fn();
        sut.subscribe(KafkaPersonCreatedEvent, handler);

        await sut.handleMessage(message);

        expect(handler).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Handling event: KafkaPersonCreatedEvent for test');
    });

    it('should log error if event type header is missing', async () => {
        const message: DeepMocked<KafkaMessage> = createMock<KafkaMessage>({
            key: Buffer.from('test'),
            value: Buffer.from(JSON.stringify(new TestEvent())),
            headers: {},
        });

        await sut.handleMessage(message);

        expect(logger.error).toHaveBeenCalledWith('Event type header is missing');
    });

    it('should log error if event type is unknown', async () => {
        const message: DeepMocked<KafkaMessage> = createMock<KafkaMessage>({
            key: Buffer.from('test'),
            value: Buffer.from(JSON.stringify(new TestEvent())),
            headers: { eventKey: 'UnknownEvent' },
        });

        await sut.handleMessage(message);

        expect(logger.error).toHaveBeenCalledWith('Unknown event type: UnknownEvent');
    });

    it('should log error if handler throws an exception', async () => {
        const message: DeepMocked<KafkaMessage> = createMock<KafkaMessage>({
            key: Buffer.from('test'),
            value: Buffer.from(JSON.stringify(new TestEvent())),
            headers: { eventKey: 'user.created' },
        });

        const handler: jest.Mock = jest.fn().mockRejectedValue(new Error('Handler error'));
        sut.subscribe(KafkaPersonCreatedEvent, handler);

        await sut.handleMessage(message);

        expect(logger.logUnknownAsError).toHaveBeenCalled();
    });

    it('should log error if message value is invalid JSON', async () => {
        const message: DeepMocked<KafkaMessage> = createMock<KafkaMessage>({
            key: Buffer.from('test'),
            value: undefined,
            headers: { eventKey: 'user.created' },
        });

        const handler: jest.Mock = jest.fn();
        sut.subscribe(KafkaPersonCreatedEvent, handler);

        await sut.handleMessage(message);

        expect(handler).toHaveBeenCalledWith({});
    });

    it('should publish event correctly', async () => {
        const deleteEvent: KafkaPersonDeletedEvent = new KafkaPersonDeletedEvent('test', 'test');

        await sut.publish(deleteEvent);

        expect(producer.send).toHaveBeenCalledWith({
            topic: 'prefix.user-topic',
            messages: [{ key: 'test', value: JSON.stringify(deleteEvent), headers: { eventKey: 'user.deleted' } }],
        });
        expect(logger.info).toHaveBeenCalledWith('Publishing event to kafka for test: KafkaPersonDeletedEvent');
    });

    it('should log error if Kafka producer fails during publish', async () => {
        producer.send.mockRejectedValueOnce(new Error('Producer error'));
        const deleteEvent: KafkaPersonDeletedEvent = new KafkaPersonDeletedEvent('test', 'test');

        await sut.publish(deleteEvent);

        expect(logger.error).toHaveBeenCalledWith('Error in KafkaEventService publish', expect.any(String));
    });

    it('should log error if no mapping is found for event type', async () => {
        const event: KafkaEvent = new TestEvent();

        await sut.publish(event);

        expect(logger.error).toHaveBeenCalledWith('No mapping found for event type: TestEvent');
    });

    it('callback should trigger handler method', async () => {
        let consumerCb: EachMessageHandler | undefined;
        consumer.run.mockImplementationOnce((config: ConsumerRunConfig | undefined) => {
            consumerCb = config?.eachMessage;
            return Promise.resolve();
        });

        const payload: DeepMocked<EachMessagePayload> = createMock<EachMessagePayload>({});

        const handleMessageSpy: jest.SpyInstance = jest.spyOn(sut, 'handleMessage').mockResolvedValue(undefined);

        await sut.onModuleInit();

        if (consumerCb) {
            await consumerCb(payload);
        }

        expect(handleMessageSpy).toHaveBeenCalled();
    });

    it('should log error in onModuleInit if Kafka consumer fails to connect', async () => {
        consumer.connect.mockRejectedValueOnce(new Error('Consumer error'));

        await sut.onModuleInit();

        expect(logger.error).toHaveBeenCalledWith('Error in KafkaEventService', expect.any(String));
    });

    it('should not initialize Kafka consumer and producer if feature flag is disabled in constructor', () => {
        jest.clearAllMocks();

        const configServiceKafkaDisabled: DeepMocked<ConfigService> = createMock<ConfigService>();
        configServiceKafkaDisabled.getOrThrow.mockReturnValueOnce({
            FEATURE_FLAG_USE_KAFKA: false,
        } as FeatureFlagConfig);

        new KafkaEventService(logger, kafka, configServiceKafkaDisabled);

        expect(logger.info).toHaveBeenCalledWith('Kafka is disabled');
        expect(kafka.consumer).not.toHaveBeenCalled();
        expect(kafka.producer).not.toHaveBeenCalled();
    });

    it('should not connect to Kafka if feature flag is disabled in onModuleInit', async () => {
        jest.clearAllMocks();

        const configServiceKafkaDisabled: DeepMocked<ConfigService> = createMock<ConfigService>();
        configServiceKafkaDisabled.getOrThrow.mockReturnValueOnce({
            FEATURE_FLAG_USE_KAFKA: false,
        } as FeatureFlagConfig);

        const service: KafkaEventService = new KafkaEventService(logger, kafka, configServiceKafkaDisabled);

        await service.onModuleInit();

        expect(logger.info).toHaveBeenCalledWith('Kafka is disabled');
        expect(consumer.connect).not.toHaveBeenCalled();
        expect(producer.connect).not.toHaveBeenCalled();
    });
});

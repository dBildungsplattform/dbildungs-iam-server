import { Test, TestingModule } from '@nestjs/testing';
import { Kafka } from 'kafkajs';
import { KafkaProvider, KAFKA_INSTANCE } from './kafka-client-provider.js';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('KafkaProvider', () => {
    let module: TestingModule;
    let configService: DeepMocked<ConfigService>;

    const kafkaConfigEnabled: KafkaConfig = {
        BROKER: 'localhost:9092',
        GROUP_ID: 'test-group',
        SESSION_TIMEOUT: 30000,
        HEARTBEAT_INTERVAL: 3000,
        TOPIC_PREFIX: 'test.',
        USER_TOPIC: 'user-topic',
        USER_DLQ_TOPIC: 'dlq-topic',
        ENABLED: true,
        SASL_ENABLED: false,
        USERNAME: '',
        PASSWORD: '',
    };

    const kafkaConfigSaslEnabled: KafkaConfig = {
        ...kafkaConfigEnabled,
        ENABLED: true,
        SASL_ENABLED: true,
    };

    const kafkaConfigDisabled: KafkaConfig = {
        ...kafkaConfigEnabled,
        ENABLED: false,
    };

    afterEach(async () => {
        if (module) {
            await module.close();
        }
        jest.clearAllMocks();
    });

    it('should return Kafka instance when enabled', async () => {
        configService = createMock<ConfigService>();
        configService.getOrThrow.mockReturnValue(kafkaConfigEnabled);

        module = await Test.createTestingModule({
            providers: [{ provide: ConfigService, useValue: configService }, KafkaProvider],
        }).compile();

        const kafkaInstance: Kafka | null = module.get<Kafka | null>(KAFKA_INSTANCE);

        expect(kafkaInstance).toBeInstanceOf(Kafka);
        expect(configService.getOrThrow).toHaveBeenCalledWith('KAFKA');
    });

    it('should return Kafka instance when enabled', async () => {
        configService = createMock<ConfigService>();
        configService.getOrThrow.mockReturnValue(kafkaConfigSaslEnabled);

        module = await Test.createTestingModule({
            providers: [{ provide: ConfigService, useValue: configService }, KafkaProvider],
        }).compile();

        const kafkaInstance: Kafka | null = module.get<Kafka | null>(KAFKA_INSTANCE);

        expect(kafkaInstance).toBeInstanceOf(Kafka);
        expect(configService.getOrThrow).toHaveBeenCalledWith('KAFKA');
    });

    it('should return null when Kafka is disabled', async () => {
        configService = createMock<ConfigService>();
        configService.getOrThrow.mockReturnValue(kafkaConfigDisabled);

        module = await Test.createTestingModule({
            providers: [{ provide: ConfigService, useValue: configService }, KafkaProvider],
        }).compile();

        const kafkaInstance: Kafka | null = module.get<Kafka | null>(KAFKA_INSTANCE);

        expect(kafkaInstance).toBeNull();
        expect(configService.getOrThrow).toHaveBeenCalledWith('KAFKA');
    });
});

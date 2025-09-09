import { Test, TestingModule } from '@nestjs/testing';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { KafkaProvider, KAFKA_INSTANCE } from './kafka-client-provider.js';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

const Kafka: typeof KafkaJS.Kafka = KafkaJS.Kafka;

describe('KafkaProvider', () => {
    let module: TestingModule;
    let configService: DeepMocked<ConfigService>;

    const kafkaConfigEnabled: KafkaConfig = {
        BROKER: 'localhost:9092',
        GROUP_ID: 'test-group',
        SESSION_TIMEOUT: 300000,
        HEARTBEAT_INTERVAL: 3000,
        TOPIC_PREFIX: 'test.',
        USER_TOPIC: 'user-topic',
        USER_DLQ_TOPIC: 'dlq-topic',
        ENABLED: true,
        SSL_ENABLED: false,
        SSL_CA_PATH: undefined,
        SSL_CERT_PATH: undefined,
        SSL_KEY_PATH: undefined,
    };

    const kafkaConfigSslEnabled: KafkaConfig = {
        ...kafkaConfigEnabled,
        ENABLED: true,
        SSL_ENABLED: true,
        SSL_CA_PATH: '/ca.pem',
        SSL_CERT_PATH: '/cert.pem',
        SSL_KEY_PATH: '/key.pem',
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

        const kafkaInstance: KafkaJS.Kafka | null = module.get<KafkaJS.Kafka | null>(KAFKA_INSTANCE);

        expect(kafkaInstance).toBeInstanceOf(Kafka);
        expect(configService.getOrThrow).toHaveBeenCalledWith('KAFKA');
    });

    it('should return Kafka instance when enabled', async () => {
        configService = createMock<ConfigService>();
        configService.getOrThrow.mockReturnValue(kafkaConfigSslEnabled);

        module = await Test.createTestingModule({
            providers: [{ provide: ConfigService, useValue: configService }, KafkaProvider],
        }).compile();

        const kafkaInstance: KafkaJS.Kafka | null = module.get<KafkaJS.Kafka | null>(KAFKA_INSTANCE);

        expect(kafkaInstance).toBeInstanceOf(Kafka);
        expect(configService.getOrThrow).toHaveBeenCalledWith('KAFKA');
    });

    it('should return null when Kafka is disabled', async () => {
        configService = createMock<ConfigService>();
        configService.getOrThrow.mockReturnValue(kafkaConfigDisabled);

        module = await Test.createTestingModule({
            providers: [{ provide: ConfigService, useValue: configService }, KafkaProvider],
        }).compile();

        const kafkaInstance: KafkaJS.Kafka | null = module.get<KafkaJS.Kafka | null>(KAFKA_INSTANCE);

        expect(kafkaInstance).toBeNull();
        expect(configService.getOrThrow).toHaveBeenCalledWith('KAFKA');
    });
});

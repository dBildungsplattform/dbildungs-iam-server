import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';

import { Provider } from '@nestjs/common';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

export const KafkaProvider: Provider<Kafka> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>): Kafka => {
        const kafkaConfig: KafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');
        return new Kafka({ brokers: [kafkaConfig.BROKER] });
    },
    inject: [ConfigService],
};

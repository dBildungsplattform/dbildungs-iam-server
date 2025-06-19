import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';

import { Provider } from '@nestjs/common';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

export const KafkaProvider: Provider<Kafka | null> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>): Kafka | null => {
        const kafkaConfig: KafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');
        if (kafkaConfig.ENABLED !== true) {
            return null;
        }

        if (kafkaConfig.SASL_ENABLED) {
            return new Kafka({
                brokers: [kafkaConfig.BROKER],
                sasl: {
                    mechanism: 'plain',
                    username: kafkaConfig.USERNAME,
                    password: kafkaConfig.PASSWORD,
                },
            });
        } else {
            return new Kafka({
                brokers: [kafkaConfig.BROKER],
            });
        }
    },
    inject: [ConfigService],
};

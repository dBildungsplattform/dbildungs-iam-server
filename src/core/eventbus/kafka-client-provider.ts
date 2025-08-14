import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';
import * as fs from 'fs';

import { Provider } from '@nestjs/common';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

export const KafkaProvider: Provider<Kafka | null> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>): Kafka | null => {
        const kafkaConfig: KafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');
        
        if (kafkaConfig.ENABLED !== true) {
            return null;
        }

        if (!kafkaConfig.SSL) {
            throw new Error('SSL ist deaktiviert');
        }

        if (kafkaConfig.SSL_ENABLED) {
        return new Kafka({
            brokers: [kafkaConfig.BROKER],
            ssl: {
            rejectUnauthorized: true,
            ca: [fs.readFileSync(kafkaConfig.SSL_CA_PATH, 'utf-8')],
            cert: fs.readFileSync(kafkaConfig.SSL_CERT_PATH, 'utf-8'),
            key: fs.readFileSync(kafkaConfig.SSL_KEY_PATH, 'utf-8'),
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

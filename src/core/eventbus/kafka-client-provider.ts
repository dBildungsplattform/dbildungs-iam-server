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

        if (!kafkaConfig.KAFKA_SSL_ENABLED) {
            throw new Error('SSL is disabled. SSL must be enabled');
        }

        
        if (
            !kafkaConfig.KAFKA_SSL_CA_PATH ||
            !kafkaConfig.KAFKA_SSL_CERT_PATH ||
            !kafkaConfig.KAFKA_SSL_KEY_PATH ||
            !kafkaConfig.KAFKA_SSL_SERVERNAME
        ){
            throw new Error('All SSL parameters (CA, CERT, KEY, SERVERNAME) must be set when SSL is enabled');
}

        if (kafkaConfig.KAFKA_SSL_ENABLED) {
        return new Kafka({
            brokers: [kafkaConfig.BROKER],
            ssl: {
            rejectUnauthorized: true,
            ca: [fs.readFileSync(kafkaConfig.KAFKA_SSL_CA_PATH, 'utf-8')],
            cert: fs.readFileSync(kafkaConfig.KAFKA_SSL_CERT_PATH, 'utf-8'),
            key: fs.readFileSync(kafkaConfig.KAFKA_SSL_KEY_PATH, 'utf-8'),
            servername: kafkaConfig.KAFKA_SSL_SERVERNAME,
            },
        });

        } else {
            return new Kafka({brokers: [kafkaConfig.BROKER],
            });
        }
    },
    inject: [ConfigService],
};

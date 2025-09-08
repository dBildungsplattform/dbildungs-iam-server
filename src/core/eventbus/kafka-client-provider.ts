import { KafkaJS } from '@confluentinc/kafka-javascript';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';
import * as fs from 'fs';

import { Provider } from '@nestjs/common';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

export const KafkaProvider: Provider<KafkaJS.Kafka | null> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>): KafkaJS.Kafka | null => {
        const kafkaConfig: KafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');

        if (kafkaConfig.KAFKA_SSL_ENABLED) {
            const caPath: string | undefined = kafkaConfig.KAFKA_SSL_CA_PATH;
            const certPath: string | undefined = kafkaConfig.KAFKA_SSL_CERT_PATH;
            const keyPath: string | undefined = kafkaConfig.KAFKA_SSL_KEY_PATH;

            if (!caPath || !certPath || !keyPath) {
                throw new Error('SSL enabled but cert paths are missing');
            }

            const kafka = new KafkaJS.Kafka({
                'ssl.ca.pem': fs.readFileSync(caPath, 'utf-8'),
                'ssl.certificate.pem': fs.readFileSync(certPath, 'utf-8'),
                'ssl.key.pem': fs.readFileSync(keyPath, 'utf-8'),
                kafkaJS: {
                    brokers: kafkaConfig.BROKER,
                    logLevel: KafkaJS.logLevel.DEBUG,
                    connectionTimeout: 30000,
                },
            });

            const admin = kafka.admin();

            void admin
                .connect()
                .then(() => admin.listTopics())
                .then((topics) => console.log(topics));

            return kafka;
        } else {
            throw new Error('SSL is disabled. SSL must be enabled');
        }
    },
    inject: [ConfigService],
};

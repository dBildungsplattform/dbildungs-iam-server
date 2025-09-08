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

            const kafka: KafkaJS.Kafka = new KafkaJS.Kafka({
                'enable.ssl.certificate.verification': false,
                'ssl.ca.pem': fs.readFileSync(caPath, 'utf8'),
                'ssl.certificate.pem': fs.readFileSync(certPath, 'utf8'),
                'ssl.key.pem': fs.readFileSync(keyPath, 'utf8'),
                'bootstrap.servers': kafkaConfig.BROKER.join(','),
                log_level: 7,
            });

            const admin: KafkaJS.Admin = kafka.admin();

            void admin
                .connect()
                .then(() => admin.listTopics())
                .then((topics: string[]) => console.log(topics));

            return kafka;
        } else {
            throw new Error('SSL is disabled. SSL must be enabled');
        }
    },
    inject: [ConfigService],
};

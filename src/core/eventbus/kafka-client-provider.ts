import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

function configSslEnabled(config: KafkaConfig): config is KafkaConfig<true> {
    return config.SSL_ENABLED;
}

export const KafkaProvider: Provider<KafkaJS.Kafka | null> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>): KafkaJS.Kafka | null => {
        const kafkaConfig: KafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');

        if (kafkaConfig.ENABLED !== true) {
            return null;
        }

        if (configSslEnabled(kafkaConfig)) {
            const caPath: string = kafkaConfig.SSL_CA_PATH;
            const certPath: string = kafkaConfig.SSL_CERT_PATH;
            const keyPath: string = kafkaConfig.SSL_KEY_PATH;

            return new KafkaJS.Kafka({
                'bootstrap.servers': kafkaConfig.BROKER,
                'security.protocol': 'ssl',
                'enable.ssl.certificate.verification': false,
                'ssl.ca.location': caPath,
                'ssl.certificate.location': certPath,
                'ssl.key.location': keyPath,
            });
        } else {
            return new KafkaJS.Kafka({
                'bootstrap.servers': kafkaConfig.BROKER,
            });
        }
    },
    inject: [ConfigService],
};

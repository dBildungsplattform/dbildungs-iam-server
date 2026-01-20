import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { inspect } from 'node:util';

import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';
import { ClassLogger } from '../logging/class-logger.js';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

function configSslEnabled(config: KafkaConfig): config is KafkaConfig<true> {
    return config.SSL_ENABLED;
}

@Injectable()
export class KafkaLogger implements KafkaJS.Logger {
    public constructor(private readonly logger: ClassLogger) {}

    private makeMessage(message: string, extra?: object): string {
        return `${message} ${inspect(extra, { breakLength: Infinity, depth: 2, compact: true })}`;
    }

    public info(message: string, extra?: object): void {
        this.logger.info(this.makeMessage(message, extra));
    }

    public error(message: string, extra?: object): void {
        this.logger.error(this.makeMessage(message, extra));
    }

    public warn(message: string, extra?: object): void {
        this.logger.warning(this.makeMessage(message, extra));
    }

    public debug(message: string, extra?: object): void {
        this.logger.debug(this.makeMessage(message, extra));
    }

    public namespace(): KafkaLogger {
        // Don't support namespaced loggers
        return this;
    }

    public setLogLevel(): void {
        // Don't support setting the loglevel
    }
}

export const KafkaProvider: Provider<KafkaJS.Kafka | null> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>, logger: KafkaLogger): KafkaJS.Kafka | null => {
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
                kafkaJS: {
                    brokers: [],
                    logger,
                },
            });
        } else {
            return new KafkaJS.Kafka({
                'bootstrap.servers': kafkaConfig.BROKER,
                kafkaJS: {
                    brokers: [],
                    logger,
                },
            });
        }
    },
    inject: [ConfigService, KafkaLogger],
};

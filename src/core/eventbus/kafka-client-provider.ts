import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from '../../shared/config/kafka.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';

import { Provider } from '@nestjs/common';
import { FeatureFlagConfig } from '../../shared/config/featureflag.config.js';

export const KAFKA_INSTANCE: symbol = Symbol('KAFKA_INSTANCE');

export const KafkaProvider: Provider<Kafka | null> = {
    provide: KAFKA_INSTANCE,
    useFactory: (configService: ConfigService<ServerConfig>): Kafka | null => {
        const featureFlagConfig: FeatureFlagConfig = configService.getOrThrow<FeatureFlagConfig>('FEATUREFLAG');
        if (featureFlagConfig.FEATURE_FLAG_USE_KAFKA === false) {
            return null;
        }
        const kafkaConfig: KafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');
        return new Kafka({ brokers: [kafkaConfig.BROKER] });
    },
    inject: [ConfigService],
};

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

    if (kafkaConfig.SSL_ENABLED) {
      const caPath = kafkaConfig.SSL_CA_PATH;
      const certPath = kafkaConfig.SSL_CERT_PATH;
      const keyPath = kafkaConfig.SSL_KEY_PATH;

      if (!caPath || !certPath || !keyPath) {
        throw new Error('SSL enabled but cert paths are missing');
      }

      return new Kafka({
        brokers: [kafkaConfig.BROKER],
        ssl: {
          rejectUnauthorized: true,
          ca: [fs.readFileSync(caPath, 'utf-8')],
          cert: fs.readFileSync(certPath, 'utf-8'),
          key: fs.readFileSync(keyPath, 'utf-8'),
        },
      });
    } else {
      throw new Error('SSL is disabled. SSL must be enabled');
    }
  },
  inject: [ConfigService],
};
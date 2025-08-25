import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, KafkaMessage, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import util from 'util';

import { ClassLogger } from '../../logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { KafkaConfig } from '../../../shared/config/kafka.config.js';
import { KAFKA_INSTANCE } from '../kafka-client-provider.js';

import {
  isKafkaEventKey,
  KafkaEventKey,
  KafkaEventMapping,
  KafkaEventMappingEntry,
  KafkaTopic,
  KafkaTopicDlq,
} from '../types/kafka-event-mapping.js';
import { BaseEvent } from '../../../shared/events/index.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';

@Injectable()
export class KafkaEventService implements OnModuleInit, OnModuleDestroy {
  private consumer?: Consumer;
  private producer?: Producer;
  private readonly kafkaConfig: KafkaConfig;

  private lastHeartbeat: Date = new Date();
  private heartbeatCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly logger: ClassLogger,
    @Inject(KAFKA_INSTANCE) private readonly kafka: Kafka,
    configService: ConfigService<ServerConfig>,
  ) {
    this.kafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');

    if (!this.kafkaConfig.ENABLED) {
      this.logger.info('Kafka is disabled');
      return;
    }

    this.consumer = this.kafka.consumer({
      groupId: this.kafkaConfig.GROUP_ID,
      sessionTimeout: this.kafkaConfig.SESSION_TIMEOUT,
      heartbeatInterval: this.kafkaConfig.HEARTBEAT_INTERVAL,
      allowAutoTopicCreation: false,
    });

    this.producer = this.kafka.producer();
  }

  // =======================
  // Lifecycle
  // =======================
  async onModuleInit(): Promise<void> {
    if (!this.consumer) return;

    try {
      this.logger.info('Connecting to Kafka...');
      await this.consumer.connect();

      // 👂 Heartbeat Listener
      this.consumer.on('consumer.heartbeat', () => {
        this.lastHeartbeat = new Date();
        this.logger.debug(`Heartbeat received at ${this.lastHeartbeat.toISOString()}`);
      });

      // 👀 Watchdog starten
      this.startHeartbeatCheck();

      // Alle Topics abonnieren
      const topics = this.getTopicSetWithPrefixFromMappings();
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: true });
      }

      await this.consumer.run({
        autoCommit: true,
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          this.logger.info(
            `Consuming from topic=${topic}, partition=${partition}, offset=${message.offset}`,
          );
          await heartbeat();

          try {
            await this.handleMessage(message, heartbeat);
          } catch (err) {
            this.logger.error(`Error while handling message → sending to DLQ`, err);
            await this.publishToDLQ(message, err);
          }

          await heartbeat();
        },
      });

      await this.producer?.connect();
    } catch (err) {
      this.logger.error('Error in KafkaEventService', util.inspect(err));
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.heartbeatCheckInterval);
    await this.consumer?.disconnect();
    await this.producer?.disconnect();
  }

  // =======================
  // Heartbeat Watchdog
  // =======================
  private startHeartbeatCheck() {
    const interval = this.kafkaConfig.HEARTBEAT_INTERVAL * 3; // Sicherheitsfaktor 3x
    this.heartbeatCheckInterval = setInterval(async () => {
      const now = new Date();
      if (this.lastHeartbeat.getTime() < now.getTime() - interval) {
        this.logger.error(
          `No heartbeat since ${this.lastHeartbeat.toISOString()} → restarting consumer`,
        );
        await this.restartConsumer();
      }
    }, interval);
  }

  private async restartConsumer() {
    try {
      this.logger.warn('Restarting Kafka consumer...');
      await this.consumer?.disconnect();
      await this.consumer?.connect();

      const topics = this.getTopicSetWithPrefixFromMappings();
      for (const topic of topics) {
        await this.consumer?.subscribe({ topic, fromBeginning: false });
      }

      this.logger.info('Consumer restarted successfully');
    } catch (err) {
      this.logger.error('Failed to restart consumer', util.inspect(err));
    }
  }

  // =======================
  // Nachrichten-Handling
  // =======================
  private async handleMessage(message: KafkaMessage, heartbeat: () => Promise<void>) {
    const eventKey: string | undefined = message.headers?.['eventKey']?.toString();
    if (!eventKey || !isKafkaEventKey(eventKey)) {
      this.logger.error(`Invalid or missing eventKey`);
      return;
    }

    const mappingEntry: KafkaEventMappingEntry = KafkaEventMapping[eventKey];
    const { eventClass } = mappingEntry;

    let eventData: Record<string, unknown>;
    try {
      eventData = JSON.parse(message.value?.toString() || '{}');
    } catch (error) {
      this.logger.error('Failed to parse Kafka message', error);
      return;
    }

    const kafkaEvent: BaseEvent & KafkaEvent = Object.assign(new eventClass(), eventData);
    this.logger.info(`Handling event ${eventClass.name}`);

    // ⚡ Handler ausführen
    const handlers = []; // → hier würdest du deine Handler registrieren
    if (!handlers.length) return;

    for (const handler of handlers) {
      try {
        await handler(kafkaEvent, heartbeat);
      } catch (err) {
        this.logger.error(`Handler failed for event ${eventClass.name}`, err);
        await this.publishToDLQ(message, err);
      }
    }
  }

  // =======================
  // Producer + DLQ
  // =======================
  private async publishToDLQ(message: KafkaMessage, error: Error) {
    const dlqTopic = `${this.kafkaConfig.TOPIC_PREFIX}dead-letter-queue`;
    try {
      await this.producer?.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key?.toString() || 'unknown',
            value: message.value?.toString(),
            headers: { error: error.message, eventKey: message.headers?.['eventKey']?.toString() || '' },
          },
        ],
      });
      this.logger.warn(`Message sent to DLQ: ${dlqTopic}`);
    } catch (err) {
      this.logger.error(`Failed to send to DLQ`, err);
    }
  }

  private getTopicSetWithPrefixFromMappings(): Set<string> {
    const topics: Set<string> = new Set();
    for (const { topic } of Object.values(KafkaEventMapping)) {
      topics.add(this.kafkaConfig.TOPIC_PREFIX + topic);
    }
    return topics;
  }
}

import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, KafkaMessage, Producer } from 'kafkajs';
import { BaseEvent } from '../../../shared/events/index.js';
import { Constructor, EventHandlerType } from '../types/util.types.js';
import { ClassLogger } from '../../logging/class-logger.js';
import {
    isKafkaEventKey,
    KafkaEventMapping,
    KafkaEventMappingEntry,
    KafkaTopic,
    KafkaTopicDlq,
} from '../types/kafka-event-mapping.js';
import util from 'util';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { KafkaConfig } from '../../../shared/config/kafka.config.js';
import { KAFKA_INSTANCE } from '../kafka-client-provider.js';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class KafkaEventService implements OnModuleInit, OnModuleDestroy {
    private readonly handlerMap: Map<Constructor<BaseEvent>, EventHandlerType<BaseEvent>> = new Map();

    private readonly consumer?: Consumer;

    private producer?: Producer;

    private readonly kafkaConfig: KafkaConfig;

    public constructor(
        private readonly logger: ClassLogger,
        @Inject(KAFKA_INSTANCE) private readonly kafka: Kafka,
        configService: ConfigService<ServerConfig>,
    ) {
        this.kafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');
        if (this.kafkaConfig.ENABLED !== true) {
            this.logger.info('Kafka is disabled');
            return;
        }
        this.consumer = this.kafka.consumer({
            groupId: this.kafkaConfig.GROUP_ID,
            sessionTimeout: this.kafkaConfig.SESSION_TIMEOUT,
            heartbeatInterval: this.kafkaConfig.HEARTBEAT_INTERVAL,
        });
        this.producer = this.kafka.producer();
    }

    public async onModuleInit(): Promise<void> {
        try {
            if (this.kafkaConfig.ENABLED !== true) {
                this.logger.info('Kafka is disabled');
                return;
            }

            this.logger.info('Connecting to Kafka');
            await this.consumer?.connect();
            const topics: Set<string> = this.getTopicSetWithPrefixFromMappings();
            await Promise.all(
                Array.from(topics).map((topic: string) => this.consumer?.subscribe({ topic, fromBeginning: true })),
            );

            await this.consumer?.run({
                eachMessage: async ({ message }: { message: KafkaMessage }) => {
                    await this.handleMessage(message);
                },
            });

            await this.producer?.connect();
        } catch (err) {
            this.logger.error('Error in KafkaEventService', util.inspect(err));
        }
    }

    public async onModuleDestroy(): Promise<void> {
        await this.consumer?.disconnect();
        await this.producer?.disconnect();
    }

    public subscribe<Event extends BaseEvent>(eventType: Constructor<Event>, handler: EventHandlerType<Event>): void {
        this.handlerMap.set(eventType, handler as EventHandlerType<BaseEvent>);
    }

    public async handleMessage(message: KafkaMessage): Promise<void> {
        const personId: string | undefined = message.key?.toString();

        const eventKey: string | undefined = message.headers?.['eventKey']?.toString();
        if (!eventKey) {
            this.logger.error('Event type header is missing');
            return;
        }
        if (!isKafkaEventKey(eventKey)) {
            this.logger.error(`Event type in header: ${eventKey} is not a valid KafkaEventKey`);
            return;
        }

        const mappingEntry: KafkaEventMappingEntry | undefined = KafkaEventMapping[eventKey];
        if (!mappingEntry) {
            this.logger.error(`Unknown event key: ${eventKey}`);
            return;
        }
        const { eventClass }: { eventClass: Constructor<BaseEvent & KafkaEvent> } = mappingEntry;

        const json: string | undefined = message.value?.toString();
        if (!json) {
            this.logger.error('Message value is empty or undefined');
            return;
        }

        let eventData: Record<string, unknown>;
        try {
            const parsed: unknown = JSON.parse(json);
            if (!isRecord(parsed)) {
                this.logger.error('Parsed Kafka message is not a valid object');
                return;
            }
            eventData = parsed;
        } catch (error) {
            this.logger.error('Failed to parse Kafka message', error);
            return;
        }
        const kafkaEvent: BaseEvent & KafkaEvent = Object.assign(new eventClass(), eventData);

        const handler: EventHandlerType<BaseEvent> | undefined = this.handlerMap.get(eventClass);

        if (handler) {
            try {
                this.logger.info(`Handling event: ${eventClass.name} for ${personId}`);
                const result: Result<unknown> | void = await handler(kafkaEvent);
                if (result && !result.ok) {
                    await this.publishToDLQ(kafkaEvent, result.error);
                }
            } catch (err) {
                this.logger.logUnknownAsError(`Handling event: ${eventClass.name} for ${personId} failed`, err);
            }
        }
    }

    private async sendEvent(
        event: KafkaEvent,
        eventKey: string,
        topic: string,
        additionalHeaders: Record<string, string> = {},
    ): Promise<void> {
        await this.producer?.connect();

        const eventType: string | undefined = event.constructor.name;

        const personId: string = event.getPersonID();
        const headers: Record<string, string> = { eventKey, ...additionalHeaders };

        this.logger.info(`Publishing event to Kafka for ${personId}: ${eventType} on topic ${topic}`);
        try {
            await this.producer?.send({
                topic,
                messages: [{ key: personId, value: JSON.stringify(event), headers }],
            });
        } catch (err) {
            this.logger.error(`Error publishing event to Kafka on topic ${topic}`, util.inspect(err));
        }
    }

    public async publish(event: KafkaEvent): Promise<void> {
        const eventKey: string | undefined = Object.keys(KafkaEventMapping).find(
            (key: string) => isKafkaEventKey(key) && KafkaEventMapping[key]?.eventClass === event.constructor,
        );
        if (!eventKey) {
            this.logger.error(`(Standard publishing) No mapping found for event: ${event.constructor.name}`);
            return;
        }
        if (!isKafkaEventKey(eventKey)) {
            this.logger.error(`(Standard publishing) ${eventKey} is not a valid KafkaEventKey`);
            return;
        }

        const topic: KafkaTopic | undefined = KafkaEventMapping[eventKey]?.topic;
        if (!topic) {
            this.logger.error('(Standard publishing) Topic is undefined');
            return;
        }

        const topicWithPrefix: string = this.kafkaConfig.TOPIC_PREFIX + topic;
        await this.sendEvent(event, eventKey, topicWithPrefix);
    }

    private async publishToDLQ(event: KafkaEvent, error: Error): Promise<void> {
        const eventKey: string | undefined = Object.keys(KafkaEventMapping).find(
            (key: string) => isKafkaEventKey(key) && KafkaEventMapping[key]?.eventClass === event.constructor,
        );
        if (!eventKey) {
            this.logger.error(`(DLQ publishing) No mapping found for event: ${event.constructor.name}`);
            return;
        }
        if (!isKafkaEventKey(eventKey)) {
            this.logger.error(`(DLQ publishing) ${eventKey} is not a valid KafkaEventKey`);
            return;
        }

        const topicDlq: KafkaTopicDlq | undefined = KafkaEventMapping[eventKey]?.topicDlq;
        if (!topicDlq) {
            this.logger.error(`(DLQ publishing) DLQ topic is undefined for event: ${event.constructor.name}`);
            return;
        }

        const topicWithPrefix: string = this.kafkaConfig.TOPIC_PREFIX + topicDlq;
        const errorString: string = util.inspect(error);

        await this.sendEvent(event, eventKey, topicWithPrefix, { error: errorString });
    }

    private getTopicSetWithPrefixFromMappings(): Set<string> {
        const topics: Set<string> = new Set<string>();
        for (const { topic } of Object.values(KafkaEventMapping)) {
            topics.add(this.kafkaConfig.TOPIC_PREFIX + topic);
        }
        return topics;
    }
}

import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, KafkaMessage, Producer } from 'kafkajs';
import { BaseEvent } from '../../../shared/events/index.js';
import { Constructor, EventHandlerType } from '../types/util.types.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { KafkaEventMapping } from '../types/kafka-event-mapping.js';
import util from 'util';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { KafkaConfig } from '../../../shared/config/kafka.config.js';
import { KAFKA_INSTANCE } from '../kafka-client-provider.js';
import { FeatureFlagConfig } from '../../../shared/config/index.js';

@Injectable()
export class KafkaEventService implements OnModuleInit, OnModuleDestroy {
    private readonly handlerMap: Map<Constructor<BaseEvent>, EventHandlerType<BaseEvent>> = new Map();

    private readonly consumer?: Consumer;

    private producer?: Producer;

    private readonly kafkaConfig: KafkaConfig;

    private readonly featureFlagConfig: FeatureFlagConfig;

    public constructor(
        private readonly logger: ClassLogger,
        @Inject(KAFKA_INSTANCE) private readonly kafka: Kafka,
        configService: ConfigService<ServerConfig>,
    ) {
        this.featureFlagConfig = configService.getOrThrow<FeatureFlagConfig>('FEATUREFLAG');
        this.kafkaConfig = configService.getOrThrow<KafkaConfig>('KAFKA');
        if (this.featureFlagConfig.FEATURE_FLAG_USE_KAFKA === false) {
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
            if (this.featureFlagConfig.FEATURE_FLAG_USE_KAFKA === false) {
                this.logger.info('Kafka is disabled');
                return;
            }

            this.logger.info('Connecting to Kafka');
            await this.consumer?.connect();
            await this.consumer?.subscribe({
                topic: this.kafkaConfig.TOPIC_PREFIX + this.kafkaConfig.USER_TOPIC,
                fromBeginning: true,
            });

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
        const eventType: Constructor<BaseEvent> | undefined = KafkaEventMapping[eventKey];
        if (!eventType) {
            this.logger.error(`Unknown event type: ${eventKey}`);
            return;
        }

        const event: BaseEvent = JSON.parse(message.value?.toString() ?? '{}') as BaseEvent;
        const handler: EventHandlerType<BaseEvent> | undefined = this.handlerMap.get(eventType);

        if (handler) {
            try {
                this.logger.info(`Handling event: ${eventType.name} for ${personId}`);
                await handler(event);
            } catch (err) {
                this.logger.logUnknownAsError(`Handling event: ${eventType.name} for ${personId} failed`, err);
            }
        }
    }

    public async publish(event: KafkaEvent): Promise<void> {
        await this.producer?.connect();
        const eventType: string | undefined = event.constructor.name;
        const eventKey: string | undefined = Object.keys(KafkaEventMapping).find(
            (key: string) => KafkaEventMapping[key] === event.constructor,
        );

        if (!eventKey) {
            this.logger.error(`No mapping found for event type: ${eventType}`);
            return;
        }

        const personId: string = event.getPersonID();

        this.logger.info(`Publishing event to kafka for ${personId}: ${eventType}`);
        try {
            await this.producer?.send({
                topic: this.kafkaConfig.TOPIC_PREFIX + this.kafkaConfig.USER_TOPIC,
                messages: [{ key: personId, value: JSON.stringify(event), headers: { eventKey: eventKey } }],
            });
        } catch (err) {
            this.logger.error('Error in KafkaEventService publish', util.inspect(err));
        }
    }
}

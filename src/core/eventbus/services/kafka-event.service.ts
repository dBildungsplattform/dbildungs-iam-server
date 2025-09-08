import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { BaseEvent } from '../../../shared/events/index.js';
import { Constructor, EventHandlerType, MaybePromise } from '../types/util.types.js';
import { ClassLogger } from '../../logging/class-logger.js';
import {
    isKafkaEventKey,
    KafkaEventKey,
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

type Kafka = KafkaJS.Kafka;
type Consumer = KafkaJS.Consumer;
type Producer = KafkaJS.Producer;
type KafkaMessage = KafkaJS.KafkaMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// const HEARTBEAT_CHECK_INTERVAL = 10000; // 10 Sekunden, kannst du anpassen

@Injectable()
export class KafkaEventService implements OnModuleInit, OnModuleDestroy {
    private readonly handlerMap: Map<Constructor<BaseEvent>, EventHandlerType<BaseEvent>[]> = new Map();

    private readonly consumer?: Consumer;

    private producer?: Producer;

    private readonly kafkaConfig: KafkaConfig;

    //private lastHeartbeat: Date = new Date();
    //private heartbeatCheckInterval?: NodeJS.Timeout;

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
            'group.id': this.kafkaConfig.GROUP_ID,
            'session.timeout.ms': this.kafkaConfig.SESSION_TIMEOUT,
            'heartbeat.interval.ms': this.kafkaConfig.HEARTBEAT_INTERVAL,
            'allow.auto.create.topics': false,
            'enable.auto.commit': true,
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

            // Heartbeat listener
            // this.consumer?.on('consumer.heartbeat', () => {
            //     this.lastHeartbeat = new Date();
            // });

            const topics: Set<string> = this.getTopicSetWithPrefixFromMappings();
            await this.consumer?.subscribe({ topics: Array.from(topics) });

            await this.consumer?.run({
                eachMessage: async ({
                    topic,
                    partition,
                    message,
                    heartbeat,
                }: {
                    topic: string;
                    partition: number;
                    message: KafkaMessage;
                    heartbeat: () => Promise<void>;
                }) => {
                    this.logger.info(
                        `Consuming message from topic: ${topic}, partition: ${partition}, offset: ${message.offset}, key: ${message.key?.toString()}`,
                    );
                    // await heartbeat();
                    // await this.handleMessage(message, heartbeat);
                    await heartbeat();
                },
            });

            await this.producer?.connect();

            // Start heartbeat monitor
            //this.startHeartbeatCheck();
        } catch (err) {
            this.logger.error('Error in KafkaEventService', util.inspect(err));
        }
    }

    public async onModuleDestroy(): Promise<void> {
        // if (this.heartbeatCheckInterval) {
        //     clearInterval(this.heartbeatCheckInterval);
        // }
        await this.consumer?.disconnect();
        await this.producer?.disconnect();
    }

    //private startHeartbeatCheck() {
    //    this.heartbeatCheckInterval = setInterval(async () => {
    //        const now = new Date();
    //        if (this.lastHeartbeat.getTime() < now.getTime() - HEARTBEAT_CHECK_INTERVAL) {
    //            this.logger.error(`No heartbeat detected. Last heartbeat was at ${this.lastHeartbeat.toISOString()}`);
    //            await this.restartConsumer();
    //        }
    //    }, HEARTBEAT_CHECK_INTERVAL);
    //}

    // private async restartConsumer() {
    //     try {
    //         this.logger.info('Restarting Kafka consumer due to missed heartbeats...');
    //         await this.consumer?.disconnect();
    //         await this.consumer?.connect();

    //         const topics: Set<string> = this.getTopicSetWithPrefixFromMappings();
    //         await Promise.all(
    //             Array.from(topics).map((topic: string) => this.consumer?.subscribe({ topic, fromBeginning: true })),
    //         );

    //         this.logger.info('Kafka consumer restarted successfully.');
    //     } catch (err) {
    //         this.logger.error('Failed to restart Kafka consumer', util.inspect(err));
    //     }
    // }

    public subscribe<Event extends BaseEvent>(eventType: Constructor<Event>, handler: EventHandlerType<Event>): void {
        const handlers: EventHandlerType<BaseEvent>[] = this.handlerMap.get(eventType) ?? [];
        handlers.push(handler as EventHandlerType<BaseEvent>);
        this.handlerMap.set(eventType, handlers);
    }

    public async handleMessage(message: KafkaMessage, heartbeat: () => Promise<void>): Promise<void> {
        const eventKey: string | undefined = message.headers?.['eventKey']?.toString();

        if (!eventKey) {
            this.logger.error('Event type header is missing');
            return;
        }
        if (!isKafkaEventKey(eventKey)) {
            this.logger.error(`Event type in header: ${eventKey} is not a valid KafkaEventKey`);
            return;
        }

        const mappingEntry: KafkaEventMappingEntry = KafkaEventMapping[eventKey] satisfies KafkaEventMappingEntry;
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
        const handlers: EventHandlerType<BaseEvent>[] | undefined = this.handlerMap.get(eventClass);

        if (handlers?.length) {
            this.logger.info(`Handling event: ${eventClass.name} with ${handlers.length} handlers`);
            const handlerPromises: Promise<Result<unknown>>[] = handlers.map(
                async (handler: EventHandlerType<BaseEvent>) => {
                    try {
                        const res: Result<unknown, Error> = await this.runWithTimoutAndKeepAlive(
                            handler,
                            kafkaEvent,
                            heartbeat,
                        );
                        return res;
                    } catch (err) {
                        this.logger.logUnknownAsError(`Handler failed for event ${eventClass.name}`, err);
                        return {
                            ok: false,
                            error: new Error('Unexpected handler error'),
                        } satisfies Result<Error>;
                    }
                },
            );

            const results: PromiseSettledResult<Result<unknown>>[] = await Promise.allSettled(handlerPromises);

            const firstFailure = results.find(
                (res): res is PromiseFulfilledResult<{ ok: false; error: Error }> =>
                    res.status === 'fulfilled' && !res.value.ok && res.value.error instanceof Error,
            );

            if (firstFailure) {
                await this.publishToDLQ(kafkaEvent, firstFailure.value.error);
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
        const headers: Record<string, string> = { eventKey, ...additionalHeaders };

        this.logger.info(`Publishing ${eventType} to Kafka on topic ${topic}`);
        try {
            await this.producer?.send({
                topic,
                messages: [
                    {
                        key: event.kafkaKey,
                        value: JSON.stringify(event) ?? null,
                        headers,
                    },
                ],
            });
        } catch (err) {
            this.logger.error(`Error publishing event to Kafka on topic ${topic}`, util.inspect(err));
        }
    }

    public async publish(event: KafkaEvent): Promise<void> {
        const eventKey: KafkaEventKey | undefined = Object.keys(KafkaEventMapping).find(
            (key: string): key is KafkaEventKey =>
                isKafkaEventKey(key) && KafkaEventMapping[key]?.eventClass === event.constructor,
        );

        if (!eventKey) {
            this.logger.error(`(Standard publishing) No mapping found for event: ${event.constructor.name}`);
            return;
        }

        const topic: KafkaTopic = KafkaEventMapping[eventKey].topic;
        const topicWithPrefix: string = this.kafkaConfig.TOPIC_PREFIX + topic;
        await this.sendEvent(event, eventKey, topicWithPrefix);
    }

    public async publishToDLQ(event: KafkaEvent, error: Error): Promise<void> {
        const eventKey: KafkaEventKey | undefined = Object.keys(KafkaEventMapping).find(
            (key: string): key is KafkaEventKey =>
                isKafkaEventKey(key) && KafkaEventMapping[key]?.eventClass === event.constructor,
        );
        if (!eventKey) {
            this.logger.error(`(DLQ publishing) No mapping found for event: ${event.constructor.name}`);
            return;
        }

        const topicDlq: KafkaTopicDlq = KafkaEventMapping[eventKey].topicDlq;
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

    public runWithTimoutAndKeepAlive<Event extends BaseEvent>(
        handler: EventHandlerType<BaseEvent>,
        event: Event,
        heartbeat: () => Promise<void>,
    ): Promise<Result<unknown, Error>> {
        return new Promise((resolve) => {
            const timeoutMs: number = this.kafkaConfig.SESSION_TIMEOUT - this.kafkaConfig.HEARTBEAT_INTERVAL - 2500;

            let completed = false;

            const onTimeout = (): void => {
                if (!completed) {
                    completed = true;
                    this.logger.crit(
                        `Handler for event ${event.constructor.name} with EventID: ${event.eventID} timed out after ${timeoutMs}ms`,
                    );
                    resolve({
                        ok: false,
                        error: new Error(`Handler timed out after ${timeoutMs}ms`),
                    } satisfies Result<Error>);
                }
            };

            let timeout: NodeJS.Timeout = setTimeout(onTimeout, timeoutMs);

            const keepAlive = (): void => {
                if (!completed) {
                    this.logger.info(
                        `Handler for event ${event.constructor.name} with EventID: ${event.eventID} is still running and called keepAlive, resetting timeout`,
                    );
                    void heartbeat();
                    clearTimeout(timeout);
                    timeout = setTimeout(onTimeout, timeoutMs);
                }
            };

            const maybePromise: MaybePromise<void | Result<unknown, Error>> = handler(event, keepAlive);
            Promise.resolve(maybePromise)
                .then((result: Result<unknown> | void) => {
                    if (!completed) {
                        this.logger.info(
                            `Handler for event ${event.constructor.name} with EventID: ${event.eventID} completed successfully`,
                        );
                        clearTimeout(timeout);
                        completed = true;
                        resolve(result ?? ({ ok: true, value: null } satisfies Result<unknown>));
                    }
                })
                .catch((error: unknown) => {
                    if (!completed) {
                        this.logger.error(
                            `Handler for event ${event.constructor.name} with EventID: ${event.eventID} failed`,
                            error,
                        );
                        clearTimeout(timeout);
                        completed = true;
                        resolve({
                            ok: false,
                            error: error as Error,
                        } satisfies Result<unknown>);
                    }
                });
        });
    }
}

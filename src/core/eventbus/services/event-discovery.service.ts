import { DiscoveredMethodWithMeta, DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable } from '@nestjs/common';

import { BaseEvent } from '../../../shared/events/index.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { EVENT_HANDLER_META, KAFKA_EVENT_HANDLER_META } from '../types/metadata-key.js';
import { Constructor, EventHandlerType } from '../types/util.types.js';
import { EventService } from './event.service.js';
import { KafkaEventService } from './kafka-event.service.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { KafkaConfig } from '../../../shared/config/kafka.config.js';

type HandlerMethod = DiscoveredMethodWithMeta<Constructor<BaseEvent>>;

@Injectable()
export class EventDiscoveryService {
    private readonly kafkaEnabled: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly discoveryService: DiscoveryService,
        private readonly eventService: EventService,
        private readonly kafkaEventService: KafkaEventService,
        configService: ConfigService<ServerConfig>,
    ) {
        this.kafkaEnabled = configService.getOrThrow<KafkaConfig>('KAFKA').ENABLED;
    }

    private async discoverHandlerMethods(meta: symbol): Promise<HandlerMethod[]> {
        const controllerMethods: HandlerMethod[] = await this.discoveryService.controllerMethodsWithMetaAtKey(meta);

        const providerMethods: HandlerMethod[] = await this.discoveryService.providerMethodsWithMetaAtKey(meta);

        return [...controllerMethods, ...providerMethods];
    }

    public async registerEventHandlers(): Promise<number> {
        let results: HandlerMethod[] = await this.discoverHandlerMethods(EVENT_HANDLER_META);
        const kafkaResults: HandlerMethod[] = await this.discoverHandlerMethods(KAFKA_EVENT_HANDLER_META);

        if (this.kafkaEnabled) {
            kafkaResults.forEach((method: HandlerMethod) => {
                const eventConstructor: Constructor<BaseEvent> = method.meta;
                const eventHandler: EventHandlerType<BaseEvent> = method.discoveredMethod.handler;
                this.kafkaEventService.subscribe(
                    method.meta,
                    eventHandler.bind(method.discoveredMethod.parentClass.instance),
                );

                const parentClassName: string = method.discoveredMethod.parentClass.name;
                const handlerMethodName: string = method.discoveredMethod.methodName;

                this.logger.notice(
                    `Registered kafka handler '${parentClassName}.${handlerMethodName}' for '${eventConstructor.name}'`,
                );
            });

            results = results.filter((result: HandlerMethod) => {
                return !kafkaResults.some((kafkaResult: HandlerMethod) => {
                    return (
                        result.discoveredMethod.methodName === kafkaResult.discoveredMethod.methodName &&
                        result.discoveredMethod.parentClass.name === kafkaResult.discoveredMethod.parentClass.name
                    );
                });
            });
        }

        results.forEach((method: HandlerMethod) => {
            const eventConstructor: Constructor<BaseEvent> = method.meta;
            const eventHandler: EventHandlerType<BaseEvent> = method.discoveredMethod.handler;

            this.eventService.subscribe(method.meta, eventHandler.bind(method.discoveredMethod.parentClass.instance));

            const parentClassName: string = method.discoveredMethod.parentClass.name;
            const handlerMethodName: string = method.discoveredMethod.methodName;

            this.logger.notice(
                `Registered legacy handler '${parentClassName}.${handlerMethodName}' for '${eventConstructor.name}'`,
            );
        });

        return results.length;
    }
}

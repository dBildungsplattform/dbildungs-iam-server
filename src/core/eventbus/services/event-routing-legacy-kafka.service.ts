import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { EventService } from './event.service.js';
import { KafkaEventService } from './kafka-event.service.js';
import { BaseEvent } from '../../../shared/events/index.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { KafkaConfig } from '../../../shared/config/kafka.config.js';

@Injectable()
export class EventRoutingLegacyKafkaService {
    private readonly kafkaEnabled: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly eventService: EventService,
        private readonly kafkaEventService: KafkaEventService,
        configService: ConfigService<ServerConfig>,
    ) {
        this.kafkaEnabled = configService.getOrThrow<KafkaConfig>('KAFKA').ENABLED;
    }

    public publish(legacyEvent: BaseEvent, kafkaEvent?: KafkaEvent): void {
        const legacyEventName: string = legacyEvent.constructor.name;
        const kafkaEventName: string | undefined = kafkaEvent?.constructor.name;

        if (this.kafkaEnabled && kafkaEvent) {
            this.logger.debug(`Publishing '${kafkaEventName}' to Kafka`);
            this.kafkaEventService
                .publish(kafkaEvent)
                .then(() => this.logger.debug(`Successfully published kafka Event`))
                .catch((err: unknown) => this.logger.logUnknownAsError(`Failed publishing kafka event`, err));
        } else {
            this.logger.debug(`Publishing '${legacyEventName}' to legacy event service`);
            this.eventService.publish(legacyEvent);
        }
    }
}

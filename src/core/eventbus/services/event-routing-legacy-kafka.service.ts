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
        private readonly configService: ConfigService<ServerConfig>,
    ) {
        const kafkaConfig: KafkaConfig | undefined = this.configService.get<KafkaConfig>('KAFKA');
        this.kafkaEnabled = kafkaConfig?.ENABLED ?? false;
    }

    public async publish(legacyEvent: BaseEvent, kafkaEvent?: KafkaEvent): Promise<void> {
        const legacyEventName: string = legacyEvent.constructor.name;
        const kafkaEventName: string | undefined = kafkaEvent?.constructor.name;

        if (this.kafkaEnabled && kafkaEvent) {
            this.logger.debug(`Publishing '${kafkaEventName}' to Kafka`);
            await this.kafkaEventService.publish(kafkaEvent);
        } else {
            this.logger.debug(`Publishing '${legacyEventName}' to legacy event service`);
            this.eventService.publish(legacyEvent);
        }
    }
}

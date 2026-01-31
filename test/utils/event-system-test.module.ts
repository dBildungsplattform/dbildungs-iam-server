import { createMock } from './createMock.js';
import { Global, Module } from '@nestjs/common';
import { EventService } from '../../src/core/eventbus/index.js';
import { EventRoutingLegacyKafkaService } from '../../src/core/eventbus/services/event-routing-legacy-kafka.service.js';
import { KafkaEventService } from '../../src/core/eventbus/services/kafka-event.service.js';

@Global()
@Module({
    providers: [
        {
            provide: EventService,
            useValue: createMock(EventService),
        },
        {
            provide: KafkaEventService,
            useValue: createMock(KafkaEventService),
        },
        {
            provide: EventRoutingLegacyKafkaService,
            useValue: createMock(EventRoutingLegacyKafkaService),
        },
    ],
    exports: [EventService, KafkaEventService, EventRoutingLegacyKafkaService],
})
export class EventSystemTestModule {}

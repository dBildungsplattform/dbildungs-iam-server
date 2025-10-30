import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { EmailResolverService } from '../email-resolve-service/email-resolver.service.js';

@Injectable()
export class EmailMicroserviceEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailResolverService: EmailResolverService,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    @KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    @EventHandler(PersonenkontextUpdatedEvent)
    @EnsureRequestContext()
    public async handlePersonenkontextUpdatedEvent(
        event: PersonenkontextUpdatedEvent | KafkaPersonenkontextUpdatedEvent,
    ): Promise<void> {
        this.logger.info(
            `Received PersonenkontextUpdatedEvent, personId:${event.person.id}, username:${event.person.username}, newPKs:${event.newKontexte.length}, removedPKs:${event.removedKontexte.length}`,
        );

        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            this.logger.info(`Handle PersonenkontextUpdatedEvent in new Microservice`);
            await this.emailResolverService.setEmailAddressForPerson(event.person, event.currentKontexte);
        }
    }
}

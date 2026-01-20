import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed-event.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PrivacyIdeaAdministrationService } from '../privacy-idea-administration.service.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';

@Injectable()
export class PrivacyIdeaAdministrationServiceHandler {
    public constructor(
        private readonly privacyIdeaAdministrationService: PrivacyIdeaAdministrationService,
        private readonly logger: ClassLogger,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    @EventHandler(PersonRenamedEvent)
    @KafkaEventHandler(KafkaPersonRenamedEvent)
    @EnsureRequestContext()
    public async handlePersonRenamedEvent(event: PersonRenamedEvent | KafkaPersonRenamedEvent): Promise<void> {
        this.logger.info(`Received PersonRenamedEvent, personId:${event.personId}`);
        if (!event.username) {
            throw new Error('Username is missing');
        }

        await this.privacyIdeaAdministrationService.updateUsername(event.oldUsername, event.username);
    }
}

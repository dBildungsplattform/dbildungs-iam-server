import { EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator';
import { ClassLogger } from '../../../core/logging/class-logger';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event';
import { EmailResolverService } from '../email-resolve-service/email-resolver.service';

@Injectable()
export class EmailMicroserviceEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailResolverService: EmailResolverService,
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
            await this.emailResolverService.setEmailAddressForPerson(event.person, event.removedKontexte);
        }
    }
}

import { Injectable } from '@nestjs/common';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { EventHandler } from '../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { PersonDeletedEvent } from '../../shared/events/person-deleted.event.js';
import { PrivacyIdeaToken } from './privacy-idea-api.types.js';
import { KafkaPersonDeletedEvent } from '../../shared/events/kafka-person-deleted.event.js';
import { KafkaEventHandler } from '../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';

@Injectable()
export class PrivacyIdeaAdministrationEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly privacyIdeaAdministrationService: PrivacyIdeaAdministrationService,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    @KafkaEventHandler(KafkaPersonDeletedEvent)
    @EventHandler(PersonDeletedEvent)
    @EnsureRequestContext()
    public async handlePersonDeletedEvent(event: PersonDeletedEvent | KafkaPersonDeletedEvent): Promise<void> {
        this.logger.info(`Received PersonDeletedEvent, personId:${event.personId}`);
        const userTokens: PrivacyIdeaToken[] = await this.privacyIdeaAdministrationService.getUserTokens(
            event.username,
        );
        if (userTokens.length > 0) {
            try {
                await this.privacyIdeaAdministrationService.resetToken(event.username);
                this.logger.info(
                    `System hat für Benutzer  ${event.username} (BenutzerId: ${event.personId}) den 2FA Token zurückgesetzt.`,
                );
            } catch (error) {
                this.logger.error(
                    `System hat versucht den 2FA Token von Benutzer ${event.username} (BenutzerId: ${event.personId}) zurückzusetzen.`,
                    error,
                );
                throw error;
            }
        }
        await this.privacyIdeaAdministrationService.deleteUserWrapper(event.username);
    }
}

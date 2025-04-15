import { Injectable } from '@nestjs/common';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { EventHandler } from '../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { PersonDeletedEvent } from '../../shared/events/person-deleted.event.js';
import { PrivacyIdeaToken } from './privacy-idea-api.types.js';
import { KafkaPersonDeletedEvent } from '../../shared/events/kafka-person-deleted.event.js';
import { KafkaEventHandler } from '../../core/eventbus/decorators/kafka-event-handler.decorator.js';

@Injectable()
export class PrivacyIdeaAdministrationEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly privacyIdeaAdministrationService: PrivacyIdeaAdministrationService,
    ) {}

    @KafkaEventHandler(KafkaPersonDeletedEvent)
    @EventHandler(PersonDeletedEvent)
    public async handlePersonDeletedEvent(event: PersonDeletedEvent): Promise<void> {
        this.logger.info(`Received PersonDeletedEvent, personId:${event.personId}`);
        const userTokens: PrivacyIdeaToken[] = await this.privacyIdeaAdministrationService.getUserTokens(
            event.referrer,
        );
        if (userTokens.length > 0) {
            try {
                await this.privacyIdeaAdministrationService.resetToken(event.referrer);
                this.logger.info(
                    `System hat für Benutzer  ${event.referrer} (BenutzerId: ${event.personId}) den 2FA Token zurückgesetzt.`,
                );
            } catch (error) {
                this.logger.error(
                    `System hat versucht den 2FA Token von Benutzer ${event.referrer} (BenutzerId: ${event.personId}) zurückzusetzen.`,
                    error,
                );
                throw error;
            }
        }
        await this.privacyIdeaAdministrationService.deleteUserWrapper(event.referrer);
    }
}

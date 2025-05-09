import { Injectable } from '@nestjs/common';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { KeycloakUserService } from '../domain/keycloak-user.service.js';
import { OxMetadataInKeycloakChangedEvent } from '../../../shared/events/ox/ox-metadata-in-keycloak-changed.event.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { EmailAddressDisabledEvent } from '../../../shared/events/email/email-address-disabled.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaEmailAddressesPurgedEvent } from '../../../shared/events/email/kafka-email-addresses-purged.event.js';
import { KafkaOxMetadataInKeycloakChangedEvent } from '../../../shared/events/ox/kafka-ox-metadata-in-keycloak-changed.event.js';
import { KafkaEmailAddressDisabledEvent } from '../../../shared/events/email/kafka-email-address-disabled.event.js';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';

@Injectable()
export class KeycloakEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly kcUserService: KeycloakUserService,
        private readonly eventService: EventRoutingLegacyKafkaService,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    @KafkaEventHandler(KafkaOxUserChangedEvent)
    @EventHandler(OxUserChangedEvent)
    @EnsureRequestContext()
    public async handleOxUserChangedEvent(event: OxUserChangedEvent): Promise<void> {
        this.logger.info(
            `Received OxUserChangedEvent personId:${event.personId}, userId:${event.oxUserId}, userName:${event.oxUserName} contextId:${event.oxContextId}, contextName:${event.oxContextName}, primaryEmail:${event.primaryEmail}`,
        );

        const updateResult: Result<void> = await this.kcUserService.updateOXUserAttributes(
            event.keycloakUsername,
            event.oxUserName,
            event.oxContextName,
        );

        if (updateResult.ok) {
            return this.eventService.publish(
                new OxMetadataInKeycloakChangedEvent(
                    event.personId,
                    event.keycloakUsername,
                    event.oxUserId,
                    event.oxUserName,
                    event.oxContextName,
                    event.primaryEmail,
                ),
                new KafkaOxMetadataInKeycloakChangedEvent(
                    event.personId,
                    event.keycloakUsername,
                    event.oxUserId,
                    event.oxUserName,
                    event.oxContextName,
                    event.primaryEmail,
                ),
            );
        } else {
            this.logger.error(
                `Updating user in Keycloak FAILED for OxUserChangedEvent, personId:${event.personId}, userId:${event.oxUserId}, userName:${event.oxUserName} contextId:${event.oxContextId}, contextName:${event.oxContextName}, primaryEmail:${event.primaryEmail}`,
            );
            this.logger.error(
                `OxMetadataInKeycloakChangedEvent will NOT be published, email-address for personId:${event.personId} in REQUESTED status will NOT be ENABLED!`,
            );
        }
    }

    @KafkaEventHandler(KafkaEmailAddressDisabledEvent)
    @EventHandler(EmailAddressDisabledEvent)
    @EnsureRequestContext()
    public async handleEmailAddressDisabledEvent(event: EmailAddressDisabledEvent): Promise<void> {
        this.logger.info(`Received EmailAddressDisabledEvent personId:${event.personId}, username:${event.username}`);

        const updateResult: Result<void> = await this.kcUserService.removeOXUserAttributes(event.username);

        if (updateResult.ok) {
            this.logger.info(
                `Removed OX access for personId:${event.personId}, username:${event.username} in Keycloak`,
            );
        } else {
            this.logger.error(
                `Updating user in Keycloak FAILED for EmailAddressDisabledEvent, personId:${event.personId}, username:${event.username}`,
            );
        }
    }

    @KafkaEventHandler(KafkaEmailAddressesPurgedEvent)
    @EventHandler(EmailAddressesPurgedEvent)
    public async handleEmailAddressesPurgedEvent(event: EmailAddressesPurgedEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressesPurgedEvent personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );

        const updateResult: Result<void> = await this.kcUserService.removeOXUserAttributes(event.username);

        if (updateResult.ok) {
            return this.logger.info(
                `Removed OX access for personId:${event.personId}, username:${event.username} in Keycloak`,
            );
        }
        return this.logger.error(
            `Updating user in Keycloak FAILED for EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}`,
        );
    }
}

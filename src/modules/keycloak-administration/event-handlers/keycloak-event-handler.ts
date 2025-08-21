import { Injectable } from '@nestjs/common';

import { EntityManager } from '@mikro-orm/core';

@Injectable()
export class KeycloakEventHandler {
    public constructor(
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    /* @KafkaEventHandler(KafkaOxUserChangedEvent)
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

        if (!event.username) {
            return this.logger.info(
                `EmailAddressesPurgedEvent had UNDEFINED username, skipping removeOXUserAttributes, oxUserId:${event.oxUserId}`,
            );
        }

        const updateResult: Result<void> = await this.kcUserService.removeOXUserAttributes(event.username);

        if (updateResult.ok) {
            return this.logger.info(
                `Removed OX access for personId:${event.personId}, username:${event.username} in Keycloak`,
            );
        }
        return this.logger.error(
            `Updating user in Keycloak FAILED for EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}`,
        );
    }*/
}

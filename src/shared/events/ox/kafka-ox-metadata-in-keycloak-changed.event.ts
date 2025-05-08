import { KafkaEvent } from '../kafka-event.js';
import { OxMetadataInKeycloakChangedEvent } from './ox-metadata-in-keycloak-changed.event.js';

/**
 * Thrown when ID_OX has been filled in KC for a user after successfully creating OX-account for the user.
 */
export class KafkaOxMetadataInKeycloakChangedEvent extends OxMetadataInKeycloakChangedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.personId;
    }
}

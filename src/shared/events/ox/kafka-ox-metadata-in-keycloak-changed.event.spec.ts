import { faker } from '@faker-js/faker';
import { KafkaOxMetadataInKeycloakChangedEvent } from './kafka-ox-metadata-in-keycloak-changed.event.js';

describe('KafkaOxMetadataInKeycloakChangedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const keycloakUsername: string = faker.internet.userName();
        const oxUserId: string = faker.string.uuid();
        const oxUserName: string = faker.internet.userName();
        const oxContextName: string = faker.string.uuid();
        const email: string = faker.internet.email();

        const event: KafkaOxMetadataInKeycloakChangedEvent = new KafkaOxMetadataInKeycloakChangedEvent(
            personId,
            keycloakUsername,
            oxUserId,
            oxUserName,
            oxContextName,
            email,
        );

        expect(event).toBeInstanceOf(KafkaOxMetadataInKeycloakChangedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

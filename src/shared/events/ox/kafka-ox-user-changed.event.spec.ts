import { faker } from '@faker-js/faker';
import { KafkaOxUserChangedEvent } from './kafka-ox-user-changed.event.js';

describe('KafkaOxUserChangedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const keycloakUsername: string = faker.internet.username();
        const oxUserId: string = faker.string.uuid();
        const oxUserName: string = faker.internet.username();
        const oxContextId: string = faker.string.uuid();
        const oxContextName: string = faker.string.uuid();
        const email: string = faker.internet.email();

        const event: KafkaOxUserChangedEvent = new KafkaOxUserChangedEvent(
            personId,
            keycloakUsername,
            oxUserId,
            oxUserName,
            oxContextId,
            oxContextName,
            email,
        );

        expect(event).toBeInstanceOf(KafkaOxUserChangedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

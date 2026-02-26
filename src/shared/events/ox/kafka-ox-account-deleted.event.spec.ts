import { faker } from '@faker-js/faker';
import { KafkaOxAccountDeletedEvent } from './kafka-ox-account-deleted.event.js';

describe('KafkaOxAccountDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const keycloakUsername: string = faker.internet.username();
        const oxUserId: string = faker.string.uuid();

        const event: KafkaOxAccountDeletedEvent = new KafkaOxAccountDeletedEvent(personId, keycloakUsername, oxUserId);

        expect(event).toBeInstanceOf(KafkaOxAccountDeletedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

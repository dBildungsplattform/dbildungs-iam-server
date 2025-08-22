import { faker } from '@faker-js/faker';
import { KafkaOxSyncUserCreatedEvent } from './kafka-ox-sync-user-created.event.js';

describe('KafkaOxSyncUserCreatedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const keycloakUsername: string = faker.internet.userName();
        const oxUserId: string = faker.string.uuid();
        const oxUserName: string = faker.internet.userName();
        const oxContextName: string = faker.string.uuid();
        const oxContextId: string = faker.string.uuid();
        const email: string = faker.internet.email();

        const event: KafkaOxSyncUserCreatedEvent = new KafkaOxSyncUserCreatedEvent(
            personId,
            keycloakUsername,
            oxUserId,
            oxUserName,
            oxContextId,
            oxContextName,
            email,
        );

        expect(event).toBeInstanceOf(KafkaOxSyncUserCreatedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

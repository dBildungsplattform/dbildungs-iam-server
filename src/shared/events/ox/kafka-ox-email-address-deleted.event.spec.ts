import { faker } from '@faker-js/faker';
import { KafkaOxEmailAddressDeletedEvent } from './kafka-ox-email-address-deleted.event.js';

describe('KafkaOxEmailAddressDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const keycloakUsername: string = faker.internet.username();
        const oxUserId: string = faker.string.uuid();
        const oxUserName: string = faker.internet.username();
        const oxContextId: string = faker.string.uuid();
        const oxContextName: string = faker.string.uuid();

        const event: KafkaOxEmailAddressDeletedEvent = new KafkaOxEmailAddressDeletedEvent(
            personId,
            keycloakUsername,
            oxUserId,
            oxUserName,
            oxContextId,
            oxContextName,
        );

        expect(event).toBeInstanceOf(KafkaOxEmailAddressDeletedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

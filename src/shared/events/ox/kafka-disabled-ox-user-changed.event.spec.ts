import { faker } from '@faker-js/faker';
import { KafkaDisabledOxUserChangedEvent } from './kafka-disabled-ox-user-changed.event.js';

describe('KafkaDisabledOxUserChangedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const keycloakUsername: string = faker.internet.userName();
        const oxUserId: string = faker.string.uuid();
        const oxUserName: string = faker.internet.userName();
        const oxContextId: string = faker.string.uuid();
        const oxContextName: string = faker.string.uuid();
        const email: string = faker.internet.email();

        const event: KafkaDisabledOxUserChangedEvent = new KafkaDisabledOxUserChangedEvent(
            personId,
            keycloakUsername,
            oxUserId,
            oxUserName,
            oxContextId,
            oxContextName,
            email,
        );

        expect(event).toBeInstanceOf(KafkaDisabledOxUserChangedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

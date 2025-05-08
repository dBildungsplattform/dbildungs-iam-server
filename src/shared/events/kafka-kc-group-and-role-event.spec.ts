import { faker } from '@faker-js/faker';
import { KafkaGroupAndRoleCreatedEvent } from './kafka-kc-group-and-role-event.js';

describe('KafkaGroupAndRoleCreatedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const groupName: string = faker.string.uuid();
        const roleName: string = faker.string.uuid();

        const event: KafkaGroupAndRoleCreatedEvent = new KafkaGroupAndRoleCreatedEvent(groupName, roleName);

        expect(event).toBeInstanceOf(KafkaGroupAndRoleCreatedEvent);
        expect(event.kafkaKey).toBe(`${groupName}:${roleName}`);
    });
});

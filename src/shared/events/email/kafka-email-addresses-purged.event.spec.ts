import { faker } from '@faker-js/faker';

import { PersonID, PersonUsername } from '../../types/aggregate-ids.types.js';
import { OXUserID } from '../../types/ox-ids.types.js';
import { KafkaEmailAddressesPurgedEvent } from './kafka-email-addresses-purged.event.js';

describe('KafkaEmailAddressesPurgedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const username: PersonUsername = 'test-username';
        const oxUserId: OXUserID = faker.string.numeric();

        const event: KafkaEmailAddressesPurgedEvent = new KafkaEmailAddressesPurgedEvent(personId, username, oxUserId);

        expect(event).toBeInstanceOf(KafkaEmailAddressesPurgedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

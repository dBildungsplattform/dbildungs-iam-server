import { faker } from '@faker-js/faker';

import { PersonID, PersonReferrer } from '../types/aggregate-ids.types.js';
import { OXUserID } from '../types/ox-ids.types.js';
import { KafkaEmailAddressesPurgedEvent } from './kafka-email-addresses-purged.event.js';

describe('KafkaEmailAddressesPurgedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const referrer: PersonReferrer = 'test-referrer';
        const oxUserId: OXUserID = faker.string.numeric();

        const event: KafkaEmailAddressesPurgedEvent = new KafkaEmailAddressesPurgedEvent(personId, referrer, oxUserId);

        expect(event).toBeInstanceOf(KafkaEmailAddressesPurgedEvent);
        expect(event.kafkaKeyPersonId).toBe(personId);
    });
});

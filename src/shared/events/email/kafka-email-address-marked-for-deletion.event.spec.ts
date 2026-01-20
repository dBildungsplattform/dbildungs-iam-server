import { faker } from '@faker-js/faker';

import { EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { KafkaEmailAddressMarkedForDeletionEvent } from './kafka-email-address-marked-for-deletion.event.js';
import { EmailAddressID, PersonID, PersonUsername } from '../../types/aggregate-ids.types.js';
import { OXUserID } from '../../types/ox-ids.types.js';

describe('KafkaEmailAddressMarkedForDeletionEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const username: PersonUsername = 'test-username';
        const oxUserId: OXUserID = faker.string.numeric();
        const emailAddressId: EmailAddressID = faker.string.uuid();
        const emailStatus: EmailAddressStatus = EmailAddressStatus.ENABLED;
        const emailAddress: string = faker.internet.userName();

        const event: KafkaEmailAddressMarkedForDeletionEvent = new KafkaEmailAddressMarkedForDeletionEvent(
            personId,
            username,
            oxUserId,
            emailAddressId,
            emailStatus,
            emailAddress,
        );

        expect(event).toBeInstanceOf(KafkaEmailAddressMarkedForDeletionEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

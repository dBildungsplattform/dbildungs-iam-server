import { faker } from '@faker-js/faker';

import { EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { KafkaEmailAddressDeletedEvent } from './kafka-email-address-deleted.event.js';
import { EmailAddressID, PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';
import { OXUserID } from '../../types/ox-ids.types.js';

describe('KafkaEmailAddressDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const referrer: PersonReferrer = 'test-referrer';
        const oxUserId: OXUserID = faker.string.numeric();
        const emailAddressId: EmailAddressID = faker.string.uuid();
        const emailStatus: EmailAddressStatus = EmailAddressStatus.ENABLED;
        const emailAddress: string = faker.internet.userName();

        const event: KafkaEmailAddressDeletedEvent = new KafkaEmailAddressDeletedEvent(
            personId,
            referrer,
            oxUserId,
            emailAddressId,
            emailStatus,
            emailAddress,
        );

        expect(event).toBeInstanceOf(KafkaEmailAddressDeletedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

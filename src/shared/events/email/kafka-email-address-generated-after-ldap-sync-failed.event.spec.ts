import { faker } from '@faker-js/faker';

import { EmailAddressID, PersonID, PersonUsername } from '../../types/aggregate-ids.types.js';
import { KafkaEmailAddressGeneratedAfterLdapSyncFailedEvent } from './kafka-email-address-generated-after-ldap-sync-failed.event.js';

describe('KafkaEmailAddressGeneratedAfterLdapSyncFailedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const username: PersonUsername = 'test-username';
        const emailAddressId: EmailAddressID = faker.string.uuid();
        const enabled: boolean = true;
        const emailAddress: string = faker.internet.userName();
        const orgaKennung: string = faker.string.numeric();

        const event: KafkaEmailAddressGeneratedAfterLdapSyncFailedEvent =
            new KafkaEmailAddressGeneratedAfterLdapSyncFailedEvent(
                personId,
                username,
                emailAddressId,
                emailAddress,
                enabled,
                orgaKennung,
            );

        expect(event).toBeInstanceOf(KafkaEmailAddressGeneratedAfterLdapSyncFailedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

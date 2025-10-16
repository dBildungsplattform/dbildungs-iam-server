import { DoFactory } from '../../../../test/utils/do-factory.js';
import { Person } from '../../../modules/person/domain/person.js';
import { KafkaLdapEmailAddressDeletedEvent } from './kafka-ldap-email-address-deleted.event.js';

describe('KafkaLdapEmailAddressDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const person: Person<true> = DoFactory.createPerson(true);

        const event: KafkaLdapEmailAddressDeletedEvent = new KafkaLdapEmailAddressDeletedEvent(
            person.id,
            person.username,
            person.email!,
        );

        expect(event).toBeInstanceOf(KafkaLdapEmailAddressDeletedEvent);
        expect(event.kafkaKey).toBe(person.id);
    });
});

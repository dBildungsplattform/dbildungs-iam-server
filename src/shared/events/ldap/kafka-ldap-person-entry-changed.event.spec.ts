import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { Person } from '../../../modules/person/domain/person.js';
import { KafkaLdapPersonEntryChangedEvent } from './kafka-ldap-person-entry-changed.event.js';

describe('KafkaLdapPersonEntryChangedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const person: Person<true> = DoFactory.createPerson(true);
        const primaryMail: string = faker.internet.email();
        const alternativeMail: string = faker.internet.email();
        const passwordChanged: boolean = faker.datatype.boolean();

        const event: KafkaLdapPersonEntryChangedEvent = new KafkaLdapPersonEntryChangedEvent(
            person.id,
            primaryMail,
            alternativeMail,
            passwordChanged,
        );

        expect(event).toBeInstanceOf(KafkaLdapPersonEntryChangedEvent);
        expect(event.kafkaKey).toBe(person.id);
    });
});

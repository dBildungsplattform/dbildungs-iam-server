import { KafkaEvent } from '../kafka-event.js';
import { LdapEmailAddressDeletedEvent } from './ldap-email-address-deleted.event.js';

export class KafkaLdapEmailAddressDeletedEvent extends LdapEmailAddressDeletedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.personId;
    }
}

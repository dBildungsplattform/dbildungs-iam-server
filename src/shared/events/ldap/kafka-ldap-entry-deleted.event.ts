import { KafkaEvent } from '../kafka-event.js';
import { LdapEntryDeletedEvent } from './ldap-entry-deleted.event.js';

export class KafkaLdapEntryDeletedEvent extends LdapEntryDeletedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.personId;
    }
}

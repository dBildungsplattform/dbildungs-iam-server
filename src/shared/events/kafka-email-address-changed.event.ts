import { EmailAddressChangedEvent } from './email-address-changed.event.js';
import { KafkaEvent } from './kafka-event';

export class KafkaEmailAddressChangedEvent extends EmailAddressChangedEvent implements KafkaEvent {
    getPersonID(): string {
        return this.personId;
    }
}

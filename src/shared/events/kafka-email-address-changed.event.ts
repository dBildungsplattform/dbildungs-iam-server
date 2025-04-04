import { EmailAddressChangedEvent } from './email-address-changed.event.js';
import { KafkaEvent } from './kafka-event.js';

export class KafkaEmailAddressChangedEvent extends EmailAddressChangedEvent implements KafkaEvent {
    public getPersonID(): string {
        return this.personId;
    }
}

import { EmailAddressGeneratedEvent } from './email-address-generated.event.js';
import { KafkaEvent } from './kafka-event';

export class KafkaEmailAddressGeneratedEvent extends EmailAddressGeneratedEvent implements KafkaEvent {
    getPersonID(): string {
        return this.personId;
    }
}

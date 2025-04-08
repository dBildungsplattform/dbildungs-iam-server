import { EmailAddressGeneratedEvent } from './email-address-generated.event.js';
import { KafkaEvent } from './kafka-event.js';

export class KafkaEmailAddressGeneratedEvent extends EmailAddressGeneratedEvent implements KafkaEvent {
    public get kafkaKeyPersonId(): string {
        return this.personId;
    }
}

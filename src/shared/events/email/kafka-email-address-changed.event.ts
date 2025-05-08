import { EmailAddressChangedEvent } from './email-address-changed.event.js';
import { KafkaEvent } from '../kafka-event.js';

export class KafkaEmailAddressChangedEvent extends EmailAddressChangedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.personId;
    }
}

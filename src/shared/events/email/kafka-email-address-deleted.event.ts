import { KafkaEvent } from '../kafka-event.js';
import { EmailAddressDeletedEvent } from './email-address-deleted.event.js';

export class KafkaEmailAddressDeletedEvent extends EmailAddressDeletedEvent implements KafkaEvent {
    public get kafkaKey(): string | undefined {
        return this.personId;
    }
}

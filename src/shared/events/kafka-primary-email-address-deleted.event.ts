import { KafkaEvent } from './kafka-event.js';
import { PrimaryEmailAddressDeletedEvent } from './primary-email-address-deleted.event.js';

export class KafkaPrimaryEmailAddressDeletedEvent extends PrimaryEmailAddressDeletedEvent implements KafkaEvent {
    public get kafkaKeyPersonId(): string {
        return this.personId;
    }
}

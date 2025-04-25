import { KafkaEvent } from '../kafka-event.js';
import { EmailAddressesPurgedEvent } from './email-addresses-purged.event.js';

export class KafkaEmailAddressesPurgedEvent extends EmailAddressesPurgedEvent implements KafkaEvent {
    public get kafkaKeyPersonId(): string {
        return this.personId;
    }
}

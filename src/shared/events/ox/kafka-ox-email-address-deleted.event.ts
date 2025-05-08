import { KafkaEvent } from '../kafka-event.js';
import { OxEmailAddressDeletedEvent } from './ox-email-address-deleted.event.js';

export class KafkaOxEmailAddressDeletedEvent extends OxEmailAddressDeletedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.personId;
    }
}

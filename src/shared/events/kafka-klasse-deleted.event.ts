import { KafkaEvent } from './kafka-event.js';
import { KlasseDeletedEvent } from './klasse-deleted.event.js';

export class KafkaKlasseDeletedEvent extends KlasseDeletedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.organisationId;
    }
}

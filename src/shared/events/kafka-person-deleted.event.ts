import { KafkaEvent } from './kafka-event.js';
import { PersonDeletedEvent } from './person-deleted.event.js';

export class KafkaPersonDeletedEvent extends PersonDeletedEvent implements KafkaEvent {
    getPersonID(): string {
        return this.personId;
    }
}

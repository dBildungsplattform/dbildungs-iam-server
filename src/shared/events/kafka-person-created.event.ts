import { KafkaEvent } from './kafka-event.js';
import { PersonenkontextCreatedMigrationEvent } from './personenkontext-created-migration.event.js';

export class KafkaPersonCreatedEvent extends PersonenkontextCreatedMigrationEvent implements KafkaEvent {
    getPersonID(): string {
        return this.createdKontextPerson.id;
    }
}

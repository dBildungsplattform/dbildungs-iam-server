import { KafkaEvent } from './kafka-event.js';
import { PersonenkontextCreatedMigrationEvent } from './personenkontext-created-migration.event.js';

export class KafkaPersonCreatedEvent extends PersonenkontextCreatedMigrationEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.createdKontextPerson.id;
    }
}

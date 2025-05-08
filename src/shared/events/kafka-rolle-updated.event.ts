import { KafkaEvent } from './kafka-event.js';
import { RolleUpdatedEvent } from './rolle-updated.event.js';

export class KafkaRolleUpdatedEvent extends RolleUpdatedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.rolleId;
    }
}

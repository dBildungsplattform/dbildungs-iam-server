import { KafkaEvent } from './kafka-event.js';
import { GroupAndRoleCreatedEvent } from './kc-group-and-role-event.js';

export class KafkaGroupAndRoleCreatedEvent extends GroupAndRoleCreatedEvent implements KafkaEvent {
    public get kafkaKey(): undefined {
        return undefined;
    }
}

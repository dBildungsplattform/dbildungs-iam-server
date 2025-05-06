import { KafkaEvent } from './kafka-event.js';
import { GroupAndRoleCreatedEvent } from './kc-group-and-role-event.js';

export class KafkaGroupAndRoleCreatedEvent extends GroupAndRoleCreatedEvent implements KafkaEvent {
    public get kafkaKey(): undefined {
        // TODO: No key or combine role and group to use as key?
        return undefined;
    }
}

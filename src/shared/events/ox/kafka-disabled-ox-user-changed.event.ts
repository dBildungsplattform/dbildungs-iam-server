import { KafkaEvent } from '../kafka-event.js';
import { DisabledOxUserChangedEvent } from './disabled-ox-user-changed.event.js';

/**
 * This event should be triggered when a new email-address is added to OX-account for a user
 * as result of renaming when user only has disabled email-addresses.
 */
export class KafkaDisabledOxUserChangedEvent extends DisabledOxUserChangedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.personId;
    }
}

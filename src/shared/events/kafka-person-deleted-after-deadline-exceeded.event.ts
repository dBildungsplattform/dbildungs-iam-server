import { KafkaEvent } from './kafka-event.js';
import { PersonDeletedAfterDeadlineExceededEvent } from './person-deleted-after-deadline-exceeded.event.js';

export class KafkaPersonDeletedAfterDeadlineExceededEvent
    extends PersonDeletedAfterDeadlineExceededEvent
    implements KafkaEvent
{
    public get kafkaKeyPersonId(): string {
        return this.personId;
    }
}

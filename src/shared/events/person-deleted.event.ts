import { BaseEvent } from './base-event.js';
import { PersonID, PersonUsername } from '../types/index.js';

export class PersonDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly username: PersonUsername,
        public readonly emailAddress?: string,
    ) {
        super();
    }
}

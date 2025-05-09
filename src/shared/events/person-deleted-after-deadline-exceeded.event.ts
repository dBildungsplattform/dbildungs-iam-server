import { BaseEvent } from './base-event.js';
import { PersonID, PersonReferrer } from '../types/index.js';
import { OXUserID } from '../types/ox-ids.types.js';

export class PersonDeletedAfterDeadlineExceededEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly username: PersonReferrer,
        public readonly oxUserId: OXUserID,
    ) {
        super();
    }
}

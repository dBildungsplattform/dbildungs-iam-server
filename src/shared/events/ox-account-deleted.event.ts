import { BaseEvent } from './base-event.js';
import { OXUserID } from '../types/ox-ids.types.js';
import { PersonReferrer } from '../types/aggregate-ids.types.js';

export class OxAccountDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: string,
        public readonly username: PersonReferrer,
        public readonly oxUserId: OXUserID,
    ) {
        super();
    }
}

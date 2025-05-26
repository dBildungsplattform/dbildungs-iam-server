import { BaseEvent } from '../base-event.js';
import { OXUserID } from '../../types/ox-ids.types.js';
import { PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';

export class OxAccountDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly username: PersonReferrer | undefined,
        public readonly oxUserId: OXUserID,
    ) {
        super();
    }
}

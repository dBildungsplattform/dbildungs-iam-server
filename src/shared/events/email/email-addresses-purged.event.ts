import { PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';
import { BaseEvent } from '../base-event.js';
import { OXUserID } from '../../types/ox-ids.types.js';

/**
 * Published when all EmailAddresses for a Person were removed.
 */
export class EmailAddressesPurgedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly username: PersonReferrer | undefined,
        public readonly oxUserId: OXUserID,
    ) {
        super();
    }
}

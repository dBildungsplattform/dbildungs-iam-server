import { BaseEvent } from '../base-event.js';
import { PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';

export class LdapSyncCompletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly username: PersonReferrer,
    ) {
        super();
    }
}

import { BaseEvent } from '../base-event.js';
import { PersonID, PersonUsername } from '../../types/aggregate-ids.types.js';

export class LdapEntryDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly username: PersonUsername,
    ) {
        super();
    }
}

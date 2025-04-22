import { BaseEvent } from './base-event.js';
import { PersonID, PersonReferrer } from '../types/index.js';

export class LdapEntryDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly username: PersonReferrer,
    ) {
        super();
    }
}

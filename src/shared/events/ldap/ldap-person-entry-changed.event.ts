import { BaseEvent } from '../base-event.js';
import { PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';

export class LdapPersonEntryChangedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly username: PersonReferrer,
        public readonly mailPrimaryAddress?: string,
        public readonly mailAlternativeAddress?: string,
        public readonly userPasswordChanged?: boolean,
    ) {
        super();
    }
}

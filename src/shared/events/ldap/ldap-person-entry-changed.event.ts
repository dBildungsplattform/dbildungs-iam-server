import { BaseEvent } from '../base-event.js';
import { PersonID } from '../../types/aggregate-ids.types.js';

export class LdapPersonEntryChangedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly mailPrimaryAddress?: string,
        public readonly mailAlternativeAddress?: string,
        public readonly userPasswordChanged?: boolean,
    ) {
        super();
    }
}

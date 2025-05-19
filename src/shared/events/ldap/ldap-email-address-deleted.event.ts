import { BaseEvent } from '../base-event.js';
import { PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';

export class LdapEmailAddressDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly username: PersonReferrer | undefined,
        public readonly address: string,
    ) {
        super();
    }
}

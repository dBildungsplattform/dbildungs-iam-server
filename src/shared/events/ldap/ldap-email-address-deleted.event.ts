import { BaseEvent } from '../base-event.js';
import { PersonReferrer } from '../../types/aggregate-ids.types.js';

export class LdapEmailAddressDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: string,
        public readonly username: PersonReferrer,
        public readonly address: string,
    ) {
        super();
    }
}

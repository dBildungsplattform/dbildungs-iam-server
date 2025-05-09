import { BaseEvent } from '../base-event.js';
import { OXContextID, OXContextName, OXUserID } from '../../types/ox-ids.types.js';
import { PersonID, PersonReferrer } from '../../types/aggregate-ids.types.js';

export class OxEmailAddressDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly oxUserId: OXUserID,
        public readonly username: PersonReferrer,
        public readonly address: string,
        public readonly oxContextId: OXContextID,
        public readonly oxContextName: OXContextName,
    ) {
        super();
    }
}

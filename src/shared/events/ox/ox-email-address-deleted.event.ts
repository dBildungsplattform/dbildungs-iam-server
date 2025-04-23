import { BaseEvent } from '../base-event.js';
import { OXContextID, OXContextName, OXUserID } from '../../types/ox-ids.types.js';
import { PersonReferrer } from '../../types/aggregate-ids.types.js';

export class OxEmailAddressDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: string,
        public readonly oxUserId: OXUserID,
        public readonly username: PersonReferrer,
        public readonly address: string,
        public readonly oxContextId: OXContextID,
        public readonly oxContextName: OXContextName,
    ) {
        super();
    }
}

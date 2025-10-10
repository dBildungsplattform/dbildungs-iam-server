import { EmailAddressID, PersonID, PersonUsername } from '../../types/aggregate-ids.types.js';
import { BaseEvent } from '../base-event.js';
import { EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { OXUserID } from '../../types/ox-ids.types.js';

export class EmailAddressMarkedForDeletionEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID | undefined,
        public readonly username: PersonUsername | undefined,
        public readonly oxUserId: OXUserID,
        public readonly emailAddressId: EmailAddressID,
        public readonly status: EmailAddressStatus,
        public readonly address: string,
    ) {
        super();
    }
}

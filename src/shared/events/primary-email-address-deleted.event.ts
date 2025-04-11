import { EmailAddressDeletedEvent } from './email-address-deleted.event.js';
import { EmailAddressStatus } from '../../modules/email/domain/email-address.js';
import { EmailAddressID, PersonID, PersonReferrer } from '../types/aggregate-ids.types.js';

export class PrimaryEmailAddressDeletedEvent extends EmailAddressDeletedEvent {
    public constructor(
        public override readonly personId: PersonID,
        public override readonly username: PersonReferrer,
        public override readonly emailAddressId: EmailAddressID,
        public override readonly status: EmailAddressStatus,
        public override readonly address: string,
        public readonly newPrimaryAddress: string,
    ) {
        super(personId, username, emailAddressId, status, address);
    }
}

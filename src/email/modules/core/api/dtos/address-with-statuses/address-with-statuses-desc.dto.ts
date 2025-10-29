import { EmailAddress } from '../../../domain/email-address.js';
import { EmailAddressStatus } from '../../../domain/email-address-status.js';

export class AddressWithStatusesDescDto {
    public emailAddress: EmailAddress<true>;
    public statuses: EmailAddressStatus<true>[];

    public constructor(emailAddress: EmailAddress<true>, statuses: EmailAddressStatus<true>[]) {
        this.emailAddress = emailAddress;
        this.statuses = statuses;
    }
}

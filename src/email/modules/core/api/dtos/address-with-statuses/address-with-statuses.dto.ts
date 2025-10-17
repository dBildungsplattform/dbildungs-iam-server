import { EmailAddress } from '../../../domain/email-address.js';
import { EmailAddressStatus } from '../../../domain/email-address-status.js';

export class AddressWithStatusesDto {
    public emailAddress: EmailAddress<true>;
    public statuses: EmailAddressStatus<true>[];

    public constructor(emailAddress: EmailAddress<true>, statuses: EmailAddressStatus<true>[]) {
        this.emailAddress = emailAddress;
        this.statuses = statuses;
    }
}

import { PersonID } from '../../../shared/types/index.js';
import { EmailAddress } from './email-address.js';

export class Email {
    private constructor(
        public readonly personId: PersonID,
        public readonly emailAddress: EmailAddress<boolean>,
    ) {}

    public static createNew(personId: PersonID, emailAddress: EmailAddress<boolean>): Email {
        return new Email(personId, emailAddress);
    }

    public static construct(personId: PersonID, emailAddress: EmailAddress<boolean>): Email {
        return new Email(personId, emailAddress);
    }

    public enable(): boolean {
        const oldValue: boolean = this.emailAddress.enabled;
        this.emailAddress.enabled = true;

        return oldValue;
    }

    public disable(): boolean {
        const oldValue: boolean = this.emailAddress.enabled;
        this.emailAddress.enabled = false;

        return oldValue;
    }

    public isEnabled(): boolean {
        return !!this.emailAddress && this.emailAddress.enabled;
    }

    public get currentAddress(): Option<string> {
        if (!this.emailAddress.enabled) return undefined;

        return this.emailAddress.address;
    }
}

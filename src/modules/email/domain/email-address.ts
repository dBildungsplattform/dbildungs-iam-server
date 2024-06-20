import { EmailID } from '../../../shared/types/index.js';

export class EmailAddress {
    public constructor(
        public emailId: EmailID,
        public address: string,
        public enabled: boolean,
    ) {}
}

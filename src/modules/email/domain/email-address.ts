import { EmailID } from '../../../shared/types/index.js';

export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public email: Persisted<EmailID, WasPersisted>,
        public address: string,
        public enabled: boolean,
    ) {}
}

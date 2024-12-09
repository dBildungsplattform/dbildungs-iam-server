import { BaseEvent } from './base-event.js';

export class EmailAddressAlreadyExistsEvent extends BaseEvent {
    public constructor(
        public readonly personId: string,
        public readonly orgaKennung: string,
    ) {
        super();
    }
}

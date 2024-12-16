import { BaseEvent } from './base-event.js';

export class EmailAddressDisabledEvent extends BaseEvent {
    public constructor(
        public readonly personId: string,
        public readonly username: string,
    ) {
        super();
    }
}

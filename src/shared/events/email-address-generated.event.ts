import { BaseEvent } from './base-event.js';
import { EmailAddressID, PersonID } from '../types/index.js';

/**
 * This event should be triggered when a new email-address is generated for a user and persisted successfully in the database.
 * It is used for synchronization of email-address generation and the process of requesting user-creation in OX afterward.
 * It should not be triggered by any OX-related operation.
 */
export class EmailAddressGeneratedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly emailAddressId: EmailAddressID,
        public readonly address: string,
        public readonly enabled: boolean,
    ) {
        super();
    }
}

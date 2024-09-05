import { BaseEvent } from './base-event.js';
import { OXContextName, OXUserName } from '../types/ox-ids.types.js';

/**
 * Thrown when ID_OX has been filled in KC for a user after successfully creating OX-account for the user.
 */
export class OxUserAttributesCreatedEvent extends BaseEvent {
    public constructor(
        public readonly keycloakUsername: string,
        public readonly userName: OXUserName,
        public readonly contextName: OXContextName,
    ) {
        super();
    }
}

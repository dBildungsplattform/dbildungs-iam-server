import { BaseEvent } from './base-event.js';
import { OXContextID, OXUserID } from '../types/ox-ids.types.js';

export class OxUserCreatedEvent extends BaseEvent {
    public constructor(
        public readonly keycloakUsername: string,
        public readonly userId: OXUserID,
        public readonly contextId: OXContextID,
        public readonly primaryEmail?: string,
    ) {
        super();
    }
}

import { BaseEvent } from './base-event.js';
import { OrganisationID } from '../types/index.js';

export class SchuleDeletedEvent extends BaseEvent {
    public constructor(
        public readonly organisationId: OrganisationID,
        public readonly kennung: string | undefined,
        public readonly name: string | undefined,
    ) {
        super();
    }
}

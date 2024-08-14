import { BaseEvent } from './base-event.js';
import { OrganisationID, PersonID, RolleID } from '../types/index.js';

export class SimplePersonenkontextDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {
        super();
    }
}

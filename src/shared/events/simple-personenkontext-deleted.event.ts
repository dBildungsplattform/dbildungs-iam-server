import { BaseEvent } from './base-event.js';
import { OrganisationID, PersonenkontextID, PersonID, RolleID } from '../types/index.js';

export class SimplePersonenkontextDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personenkontextID: PersonenkontextID,
        public readonly personId: PersonID,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {
        super();
    }
}

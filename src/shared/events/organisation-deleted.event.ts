import { BaseEvent } from './base-event.js';
import { OrganisationID } from '../types/index.js';
import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enums.js';

export class OrganisationDeletedEvent extends BaseEvent {
    public constructor(
        public readonly organisationId: OrganisationID,
        public readonly typ?: OrganisationsTyp,
    ) {
        super();
    }
}

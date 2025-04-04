import { BaseEvent } from './base-event.js';
import { OrganisationID } from '../types/index.js';

export class KlasseUpdatedEvent extends BaseEvent {
    public constructor(
        public readonly organisationId: OrganisationID,
        public readonly name: string,
        public readonly administriertVon: string | undefined,
    ) {
        super();
    }
}

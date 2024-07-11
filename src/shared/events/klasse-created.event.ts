import { BaseEvent } from './base-event.js';
import { OrganisationID } from '../types/index.js';

export class KlasseCreatedEvent extends BaseEvent {
    public constructor(
        public readonly id: OrganisationID,
        public readonly name: string | undefined,
        public readonly administriertVon: OrganisationID | undefined,
    ) {
        super();
    }
}

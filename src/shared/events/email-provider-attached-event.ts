import { BaseEvent } from './base-event.js';
import { PersonID, ServiceProviderID } from '../types/index.js';

export class EmailProviderAttachedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly serviceProviderId: ServiceProviderID,
    ) {
        super();
    }
}

import { BaseEvent } from './base-event.js';

export class SchuleCreatedEvent extends BaseEvent {
    public constructor(public readonly organisationId: string) {
        super();
    }
}

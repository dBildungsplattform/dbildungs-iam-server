import { BaseEvent } from './base-event.js';

export class SchuleDeletedEvent extends BaseEvent {
    public constructor(public readonly organisationId: string) {
        super();
    }
}

import { BaseEvent } from './base-event.js';

export class DeletedSchuleEvent extends BaseEvent {
    public constructor(public readonly organisationId: string) {
        super();
    }
}

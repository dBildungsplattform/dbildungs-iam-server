import { BaseEvent } from './base-event.js';

export class CreatedSchuleEvent extends BaseEvent {
    public constructor(public readonly organisationId: string) {
        super();
    }
}

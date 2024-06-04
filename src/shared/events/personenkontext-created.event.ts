import { BaseEvent } from './base-event.js';

export class PersonenkontextCreatedEvent extends BaseEvent {
    public constructor(public readonly personenkontextId: string) {
        super();
    }
}

import { BaseEvent } from './base-event.js';

export class PersonenkontextDeletedEvent extends BaseEvent {
    public constructor(public readonly personenkontextId: string) {
        super();
    }
}

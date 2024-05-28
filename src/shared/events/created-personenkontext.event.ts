import { BaseEvent } from './base-event.js';

export class CreatedPersonenkontextEvent extends BaseEvent {
    public constructor(public readonly personenkontextId: string) {
        super();
    }
}

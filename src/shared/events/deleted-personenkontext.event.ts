import { BaseEvent } from './base-event.js';

export class DeletedPersonenkontextEvent extends BaseEvent {
    public constructor(public readonly personenkontextId: string) {
        super();
    }
}

import { BaseEvent } from './base-event.js';

export class CreateGroupEvent extends BaseEvent {
    public constructor(public readonly groupName: string) {
        super();
    }
}

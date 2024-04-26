// todo: remove
import { BaseEvent } from '../types/base-event.js';

export class TestEvent extends BaseEvent {
    public constructor(public message: string) {
        super(TestEvent.name);
    }
}

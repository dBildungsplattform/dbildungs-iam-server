// todo: remove
import { BaseEvent } from '../types/base-event.js';

export class TestEvent2 extends BaseEvent {
    public test: string = 'Hi';

    public constructor(public message: string) {
        super(TestEvent2.name);
    }
}

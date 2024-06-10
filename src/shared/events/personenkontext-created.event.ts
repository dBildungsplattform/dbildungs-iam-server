import { BaseEvent } from './base-event.js';
import { PersonenkontextID } from '../types/index.js';

export class PersonenkontextCreatedEvent extends BaseEvent {
    public constructor(public readonly personenkontextId: PersonenkontextID) {
        super();
    }
}

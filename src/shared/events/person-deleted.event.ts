import { BaseEvent } from './base-event.js';
import { PersonID } from '../types/index.js';

export class PersonDeletedEvent extends BaseEvent {
    public constructor(public readonly personId: PersonID) {
        super();
    }
}

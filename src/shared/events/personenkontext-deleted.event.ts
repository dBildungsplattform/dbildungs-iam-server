import { BaseEvent } from './base-event.js';
import { PersonenkontextEventKontextData, PersonenkontextEventPersonData } from './personenkontext-event.types.js';

export class PersonenkontextDeletedEvent extends BaseEvent {
    public constructor(
        public readonly personData: PersonenkontextEventPersonData,
        public readonly kontextData: PersonenkontextEventKontextData,
    ) {
        super();
    }
}

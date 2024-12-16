import { BaseEvent } from './base-event.js';
import { PersonID, PersonReferrer } from '../types/index.js';

import type { Person } from '../../modules/person/domain/person.js';

export class PersonRenamedEvent extends BaseEvent {
    public constructor(
        public readonly personId: PersonID,
        public readonly vorname: string,
        public readonly familienname: string,
        public readonly referrer: PersonReferrer | undefined,
        public readonly oldReferrer: PersonReferrer,
    ) {
        super();
    }

    public static fromPerson(person: Person<true>, oldReferrer: string): PersonRenamedEvent {
        return new PersonRenamedEvent(person.id, person.vorname, person.familienname, person.referrer, oldReferrer);
    }
}

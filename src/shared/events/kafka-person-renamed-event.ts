import { Person } from '../../modules/person/domain/person';
import { PersonReferrer } from '../types';
import { KafkaEvent } from './kafka-event';
import { PersonRenamedEvent } from './person-renamed-event.js';

export class KafkaPersonRenamedEvent extends PersonRenamedEvent implements KafkaEvent {
    getPersonID(): string {
        return this.personId;
    }

    public static override fromPerson(
        person: Person<true>,
        oldReferrer: PersonReferrer,
        oldVorname: string,
        oldFamilienname: string,
    ): KafkaPersonRenamedEvent {
        return new KafkaPersonRenamedEvent(
            person.id,
            person.vorname,
            person.familienname,
            person.referrer,
            oldVorname,
            oldFamilienname,
            oldReferrer,
        );
    }
}

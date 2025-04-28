import { Person } from '../../modules/person/domain/person.js';
import { PersonReferrer } from '../types/aggregate-ids.types.js';
import { KafkaEvent } from './kafka-event.js';
import { PersonRenamedEvent } from './person-renamed-event.js';

export class KafkaPersonRenamedEvent extends PersonRenamedEvent implements KafkaEvent {
    public get kafkaKeyPersonId(): string {
        return this.personId;
    }

    public static override fromPerson(
        person: Person<true>,
        oldUsername: PersonReferrer,
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
            oldUsername,
        );
    }
}

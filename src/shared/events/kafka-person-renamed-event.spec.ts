import { KafkaPersonRenamedEvent } from './kafka-person-renamed-event.js';
import { Person } from '../../modules/person/domain/person.js';
import { DoFactory } from '../../../test/utils/index.js';

describe('KafkaPersonRenamedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const person: Person<true> = DoFactory.createPerson(true);

        const oldVorname: string = 'Jane';
        const oldFamilienname: string = 'Smith';
        const oldReferrer: string = 'old-referrer';

        const event: KafkaPersonRenamedEvent = KafkaPersonRenamedEvent.fromPerson(
            person,
            oldReferrer,
            oldVorname,
            oldFamilienname,
        );

        expect(event).toBeInstanceOf(KafkaPersonRenamedEvent);
        expect(event.kafkaKeyPersonId).toBe(person.id);
    });
});

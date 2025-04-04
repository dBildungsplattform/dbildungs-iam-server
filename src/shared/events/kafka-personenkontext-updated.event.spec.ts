import { KafkaPersonenkontextUpdatedEvent } from './kafka-personenkontext-updated.event.js';
import { Person } from '../../modules/person/domain/person.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { Organisation } from '../../modules/organisation/domain/organisation.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { DoFactory } from '../../../test/utils/index.js';

describe('KafkaPersonenkontextUpdatedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const person: Person<true> = DoFactory.createPerson(true);

        const newKontexte: [Personenkontext<true>, Organisation<true>, Rolle<true>][] = [] as [
            Personenkontext<true>,
            Organisation<true>,
            Rolle<true>,
        ][];
        const removedKontexte: [Personenkontext<true>, Organisation<true>, Rolle<true>][] = [] as [
            Personenkontext<true>,
            Organisation<true>,
            Rolle<true>,
        ][];
        const currentKontexte: [Personenkontext<true>, Organisation<true>, Rolle<true>][] = [] as [
            Personenkontext<true>,
            Organisation<true>,
            Rolle<true>,
        ][];
        const ldapEntryUUID: string = 'test-uuid';

        const event: KafkaPersonenkontextUpdatedEvent = KafkaPersonenkontextUpdatedEvent.fromPersonenkontexte(
            person,
            newKontexte,
            removedKontexte,
            currentKontexte,
            ldapEntryUUID,
        );

        expect(event).toBeInstanceOf(KafkaPersonenkontextUpdatedEvent);
        expect(event.getPersonID()).toBe(person.id);
    });
});

import { DoFactory } from '../../../test/utils/index.js';
import { Organisation } from '../../modules/organisation/domain/organisation.js';
import { Person } from '../../modules/person/domain/person.js';
import { PersonenkontextMigrationRuntype } from '../../modules/personenkontext/domain/personenkontext.enums.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { KafkaPersonCreatedEvent } from './kafka-person-created.event.js';

describe('KafkaPersonCreatedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const migrationType: PersonenkontextMigrationRuntype = PersonenkontextMigrationRuntype.STANDARD;
        const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
        const person: Person<true> = DoFactory.createPerson(true);
        const rolle: Rolle<true> = DoFactory.createRolle(true);
        const organisation: Organisation<true> = DoFactory.createOrganisation(true);

        const event: KafkaPersonCreatedEvent = new KafkaPersonCreatedEvent(
            migrationType,
            kontext,
            person,
            rolle,
            organisation,
        );

        expect(event).toBeInstanceOf(KafkaPersonCreatedEvent);
        expect(event.getPersonID()).toBe(person.id);
    });
});

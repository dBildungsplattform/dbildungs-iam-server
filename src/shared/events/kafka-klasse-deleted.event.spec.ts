import { faker } from '@faker-js/faker';
import { OrganisationID } from '../types/aggregate-ids.types.js';
import { KafkaKlasseDeletedEvent } from './kafka-klasse-deleted.event.js';

describe('KafkaKlasseDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const organisationId: OrganisationID = faker.string.uuid();

        const event: KafkaKlasseDeletedEvent = new KafkaKlasseDeletedEvent(organisationId);

        expect(event).toBeInstanceOf(KafkaKlasseDeletedEvent);
        expect(event.kafkaKey).toBe(organisationId);
    });
});

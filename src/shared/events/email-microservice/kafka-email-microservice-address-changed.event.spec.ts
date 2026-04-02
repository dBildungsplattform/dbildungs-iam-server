import { faker } from '@faker-js/faker';

import { KafkaEmailMicroserviceAddressChangedEvent } from './kafka-email-microservice-address-changed.event';

describe('KafkaEmailMicroserviceAddressChangedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = faker.string.uuid();
        const newPrimaryEmail: string = faker.internet.email();
        const newAlternativeEmail: string = faker.internet.email();
        const previousPrimaryEmail: string = faker.internet.email();
        const previousAlternativeEmail: string = faker.internet.email();

        const event: KafkaEmailMicroserviceAddressChangedEvent = new KafkaEmailMicroserviceAddressChangedEvent(
            personId,
            newPrimaryEmail,
            newAlternativeEmail,
            previousPrimaryEmail,
            previousAlternativeEmail,
        );

        expect(event).toBeInstanceOf(KafkaEmailMicroserviceAddressChangedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

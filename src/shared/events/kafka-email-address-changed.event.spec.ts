import { KafkaEmailAddressChangedEvent } from './kafka-email-address-changed.event.js';

describe('KafkaEmailAddressChangedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = 'test-person-id';
        const referrer: string = 'test-referrer';
        const oldEmailAddressId: string = 'old-email-address-id';
        const oldEmailAddress: string = 'old-email-address';
        const newEmailAddressId: string = 'new-email-address-id';
        const newEmailAddress: string = 'new-email-address';
        const orgaKennung: string = 'orga-kennung';

        const event: KafkaEmailAddressChangedEvent = new KafkaEmailAddressChangedEvent(
            personId,
            referrer,
            oldEmailAddressId,
            oldEmailAddress,
            newEmailAddressId,
            newEmailAddress,
            orgaKennung,
        );

        expect(event).toBeInstanceOf(KafkaEmailAddressChangedEvent);
        expect(event.kafkaKeyPersonId).toBe(personId);
    });
});

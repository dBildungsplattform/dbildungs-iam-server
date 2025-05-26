import { KafkaEmailAddressGeneratedEvent } from './kafka-email-address-generated.event.js';

describe('KafkaEmailAddressGeneratedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = 'test-person-id';
        const username: string = 'test-username';
        const EmailAddressId: string = 'email-address-id';
        const EmailAddress: string = 'email-address';
        const enabled: boolean = true;
        const orgaKennung: string = 'orga-kennung';

        const event: KafkaEmailAddressGeneratedEvent = new KafkaEmailAddressGeneratedEvent(
            personId,
            username,
            EmailAddressId,
            EmailAddress,
            enabled,
            orgaKennung,
        );

        expect(event).toBeInstanceOf(KafkaEmailAddressGeneratedEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

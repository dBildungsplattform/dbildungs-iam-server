import { KafkaPersonDeletedEvent } from './kafka-person-deleted.event.js';

describe('KafkaPersonDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = 'test-person-id';
        const referrer: string = 'test-referrer';

        const event: KafkaPersonDeletedEvent = new KafkaPersonDeletedEvent(personId, referrer);

        expect(event).toBeInstanceOf(KafkaPersonDeletedEvent);
        expect(event.getPersonID()).toBe(personId);
    });
});

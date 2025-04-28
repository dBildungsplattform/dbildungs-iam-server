import { KafkaPersonDeletedEvent } from './kafka-person-deleted.event.js';

describe('KafkaPersonDeletedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = 'test-person-id';
        const username: string = 'test-username';

        const event: KafkaPersonDeletedEvent = new KafkaPersonDeletedEvent(personId, username);

        expect(event).toBeInstanceOf(KafkaPersonDeletedEvent);
        expect(event.kafkaKeyPersonId).toBe(personId);
    });
});

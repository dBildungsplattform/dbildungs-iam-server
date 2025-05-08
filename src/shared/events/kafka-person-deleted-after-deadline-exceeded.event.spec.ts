import { KafkaPersonDeletedAfterDeadlineExceededEvent } from './kafka-person-deleted-after-deadline-exceeded.event.js';

describe('KafkaPersonDeletedAfterDeadlineExceededEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const personId: string = 'test-person-id';
        const username: string = 'test-username';

        const event: KafkaPersonDeletedAfterDeadlineExceededEvent = new KafkaPersonDeletedAfterDeadlineExceededEvent(
            personId,
            username,
        );

        expect(event).toBeInstanceOf(KafkaPersonDeletedAfterDeadlineExceededEvent);
        expect(event.kafkaKey).toBe(personId);
    });
});

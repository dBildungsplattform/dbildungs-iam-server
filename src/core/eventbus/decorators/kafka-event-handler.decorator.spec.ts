/* eslint-disable max-classes-per-file */
import { BaseEvent } from '../../../shared/events/index.js';
import { KAFKA_EVENT_HANDLER_META } from '../types/metadata-key.js';
import { KafkaEventHandler } from './kafka-event-handler.decorator.js';

class TestEvent extends BaseEvent {
    public constructor() {
        super();
    }
}

class TestClass {
    @KafkaEventHandler(TestEvent)
    public handler(_ev: TestEvent): void {}

    // @ts-expect-error typechecker should detect invalid function signature
    @KafkaEventHandler(TestEvent)
    public invalidArgs(_ev: string): void {}

    // @ts-expect-error typechecker should detect invalid function signature
    @KafkaEventHandler(TestEvent)
    public invalidArgs2(_ev: TestEvent, _xyz: string): void {}
}

describe('KafkaEventHandler decorator', () => {
    it('should set metadata', () => {
        const meta: unknown = Reflect.getMetadata(KAFKA_EVENT_HANDLER_META, TestClass.prototype.handler);

        expect(meta).toBe(TestEvent);
    });
});

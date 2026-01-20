import { randomUUID } from 'crypto';

const EVENT_MARKER: unique symbol = Symbol();

export abstract class BaseEvent {
    // Is used to brand the class, this property will never exist on the created instances.
    // Ensures, that events have to always be derived from BaseEvent
    public readonly [EVENT_MARKER]!: never;

    public readonly createdAt: Date = new Date();

    // For now generate random ID. In the future this should be replaced with the sessions correlation-ID or similar
    public readonly eventID: string = randomUUID();
}

import { BaseEvent } from './base-event.js';

export class DeleteKeycloakUserEvent extends BaseEvent {
    public constructor(public readonly keycloakUserId: string) {
        super();
    }
}

import { BaseEvent } from './base-event.js';

export class DeleteUserEvent extends BaseEvent {
    public constructor(public readonly keycloakUserId: string) {
        super();
    }
}

import { BaseEvent } from './base-event.js';

export class GroupAndRoleCreatedEvent extends BaseEvent {
    public constructor(
        public readonly groupName: string,
        public readonly roleName: string,
    ) {
        super();
    }
}

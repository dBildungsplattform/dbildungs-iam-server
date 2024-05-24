import { Injectable } from '@nestjs/common';
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { DeleteUserEvent } from '../../../shared/events/DeleteUserEvent.js';

@Injectable()
export class PersonEventService {
    public constructor(private readonly eventService: EventService) {}

    public publishUserDeletedEvent(userId: string): void {
        const deleteUserEvent: DeleteUserEvent = new DeleteUserEvent(userId);
        this.eventService.publish(deleteUserEvent);
    }
}

// todo: remove
import { Controller, Get } from '@nestjs/common';
import { EventService } from '../services/event.service.js';
import { TestEvent } from './poc-event.js';
import { EventHandler } from '../decorators/event-handler.decorator.js';
import { TestEvent2 } from './poc-event2.js';

@Controller({ path: 'event' })
export class EventPocController {
    public constructor(private readonly eventBus: EventService) {}

    @EventHandler(TestEvent)
    public testEvent(event: TestEvent): void {
        console.log('TEST: ' + event.message);
    }

    @EventHandler(TestEvent2)
    public async testEvent2(event: TestEvent2): Promise<void> {
        console.log('TEST2: ' + event.message);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('TEST2 Awaited: ' + event.message);
    }

    @Get()
    public getTest(): string {
        this.eventBus.publish(new TestEvent('Hallo!'));
        return 'Test';
    }
}

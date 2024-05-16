// eslint-disable-next-line max-classes-per-file
import { Controller, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule } from '../../../test/utils/config-test.module.js';
import { BaseEvent } from '../../shared/events/index.js';
import { EventHandler } from './decorators/event-handler.decorator.js';
import { EventModule } from './event.module.js';
import { EventService } from './services/event.service.js';

class TestEvent extends BaseEvent {
    public constructor(public mockCallback: (context: unknown) => void) {
        super();
    }
}

@Injectable()
class TestProvider {
    @EventHandler(TestEvent)
    public handleEvent(event: TestEvent): void {
        event.mockCallback(this);
    }

    public undecoratedMethod(): void {}
}

@Controller({})
class TestController {
    @EventHandler(TestEvent)
    public handleEvent(event: TestEvent): void {
        event.mockCallback(this);
    }

    public undecoratedMethod(): void {}
}

describe('EventModule (integration test)', () => {
    let module: TestingModule;

    let eventService: EventService;

    let testProvider: TestProvider;
    let testController: TestController;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [EventModule, ConfigTestModule],
            providers: [TestProvider],
            controllers: [TestController],
        }).compile();

        await module.init();

        eventService = module.get(EventService);
        testProvider = module.get(TestProvider);
        testController = module.get(TestController);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('publish', () => {
        it('should call event handlers with correct context', () => {
            const mockCallback: jest.Mock = jest.fn();

            eventService.publish(new TestEvent(mockCallback));

            expect(mockCallback).toHaveBeenCalledTimes(2);
            expect(mockCallback).toHaveBeenCalledWith(testProvider);
            expect(mockCallback).toHaveBeenCalledWith(testController);
        });
    });
});

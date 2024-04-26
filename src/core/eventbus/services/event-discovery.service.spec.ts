// eslint-disable-next-line max-classes-per-file
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Controller, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggingTestModule } from '../../../../test/utils/index.js';
import { BaseEvent } from '../../../shared/events/index.js';
import { EventHandler } from '../decorators/event-handler.decorator.js';
import { EventDiscoveryService } from './event-discovery.service.js';
import { EventService } from './event.service.js';

@Injectable()
class TestProvider {
    @EventHandler(BaseEvent)
    public handleEvent(_event: BaseEvent): void {}

    public undecoratedMethod(): void {}
}

@Controller({})
class TestController {
    @EventHandler(BaseEvent)
    public handleEvent(_event: BaseEvent): void {}

    public undecoratedMethod(): void {}
}

describe('EventService', () => {
    let module: TestingModule;

    let sut: EventDiscoveryService;
    let eventServiceMock: DeepMocked<EventService>;

    let testProvider: TestProvider;
    let testController: TestController;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, DiscoveryModule],
            providers: [
                EventDiscoveryService,
                TestProvider,
                { provide: EventService, useValue: createMock<EventService>() },
            ],
            controllers: [TestController],
        }).compile();

        await module.init();

        sut = module.get(EventDiscoveryService);
        eventServiceMock = module.get(EventService);

        testProvider = module.get(TestProvider);
        testController = module.get(TestController);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('registerEventHandlers', () => {
        it('should discover and register all event handlers in controllers', async () => {
            await sut.registerEventHandlers();

            expect(eventServiceMock.subscribe).toHaveBeenCalledWith(BaseEvent, testController.handleEvent);
        });

        it('should discover and register all event handlers in providers', async () => {
            await sut.registerEventHandlers();

            expect(eventServiceMock.subscribe).toHaveBeenCalledWith(BaseEvent, testProvider.handleEvent);
        });

        it('should return the number of registered handlers', async () => {
            const count: number = await sut.registerEventHandlers();

            expect(eventServiceMock.subscribe).toHaveBeenCalledTimes(2);
            expect(count).toBe(2);
        });
    });
});

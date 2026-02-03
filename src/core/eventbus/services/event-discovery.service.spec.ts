// eslint-disable-next-line max-classes-per-file
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { Controller, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { BaseEvent } from '../../../shared/events/index.js';
import { EventHandler } from '../decorators/event-handler.decorator.js';
import { EventDiscoveryService } from './event-discovery.service.js';
import { EventService } from './event.service.js';
import { KafkaEventService } from './kafka-event.service.js';
import { ConfigService } from '@nestjs/config';
import { KafkaEventHandler } from '../decorators/kafka-event-handler.decorator.js';

class TestEvent extends BaseEvent {
    public constructor() {
        super();
    }
}

@Injectable()
class TestProvider {
    @KafkaEventHandler(TestEvent)
    @EventHandler(TestEvent)
    public handleEvent(_event: TestEvent): void {}

    public undecoratedMethod(): void {}
}

@Controller({})
class TestController {
    @KafkaEventHandler(TestEvent)
    @EventHandler(TestEvent)
    public handleEvent(_event: TestEvent): void {}

    public undecoratedMethod(): void {}
}

describe('EventService', () => {
    let sut: EventDiscoveryService;
    let eventServiceMock: DeepMocked<EventService>;
    let kafkaEventServiceMock: DeepMocked<KafkaEventService>;

    let module: TestingModule;

    async function setupModule(useKafka: boolean = false): Promise<void> {
        const configService: DeepMocked<ConfigService> = createMock(ConfigService);
        configService.getOrThrow.mockReturnValueOnce({ ENABLED: useKafka });

        module = await Test.createTestingModule({
            imports: [LoggingTestModule, DiscoveryModule, ConfigTestModule],
            providers: [
                EventDiscoveryService,
                TestProvider,
                { provide: EventService, useValue: createMock(EventService) },
                { provide: KafkaEventService, useValue: createMock(KafkaEventService) },
                { provide: ConfigService, useValue: configService },
            ],
            controllers: [TestController],
        }).compile();

        await module.init();

        sut = module.get(EventDiscoveryService);
        eventServiceMock = module.get(EventService);
        kafkaEventServiceMock = module.get(KafkaEventService);
    }

    afterEach(async () => {
        vi.resetAllMocks();
        await module.close();
    });

    beforeEach(async () => {
        await setupModule();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('registerEventHandlers', () => {
        it('should discover and register all event handlers in controllers', async () => {
            await sut.registerEventHandlers();

            expect(eventServiceMock.subscribe).toHaveBeenCalledWith(TestEvent, expect.any(Function));
        });

        it('should discover and register all event handlers in providers', async () => {
            await sut.registerEventHandlers();

            expect(eventServiceMock.subscribe).toHaveBeenCalledWith(TestEvent, expect.any(Function));
        });

        it('should return the number of registered handlers', async () => {
            const count: number = await sut.registerEventHandlers();

            expect(eventServiceMock.subscribe).toHaveBeenCalledTimes(2);
            expect(count).toBe(2);
        });

        it('should register kafka event handlers if feature flag is set', async () => {
            await setupModule(true);

            await sut.registerEventHandlers();

            expect(kafkaEventServiceMock.subscribe).toHaveBeenCalledTimes(2);
            expect(eventServiceMock.subscribe).not.toHaveBeenCalled();
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUserEvent } from '../../../shared/events/DeleteUserEvent.js';
import { PersonEventService } from './person-event.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EventService } from '../../../core/eventbus/services/event.service.js';

describe('UserEventService', () => {
    let service: PersonEventService;
    let eventServiceMock: DeepMocked<EventService>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PersonEventService,
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
                },
            ],
        }).compile();

        service = module.get<PersonEventService>(PersonEventService);
        eventServiceMock = module.get(EventService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('publishUserDeletedEvent', () => {
        it('should publish DeleteUserEvent', () => {
            // Arrange
            const userId: string = 'testUserId';

            // Act
            service.publishUserDeletedEvent(userId);

            // Assert
            expect(eventServiceMock.publish).toHaveBeenCalledWith(new DeleteUserEvent(userId));
        });
    });
});

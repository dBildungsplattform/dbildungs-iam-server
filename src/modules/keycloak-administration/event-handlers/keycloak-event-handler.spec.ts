import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { KeycloakUserService } from '../domain/keycloak-user.service.js';
import { KeycloakEventHandler } from './keycloak-event-handler.js';
import { OxUserCreatedEvent } from '../../../shared/events/ox-user-created.event.js';
import { faker } from '@faker-js/faker';

describe('KeycloakEventHandler', () => {
    let module: TestingModule;

    let sut: KeycloakEventHandler;
    let loggerMock: DeepMocked<ClassLogger>;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                KeycloakEventHandler,
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
            ],
        }).compile();

        sut = module.get(KeycloakEventHandler);
        loggerMock = module.get(ClassLogger);
        keycloakUserServiceMock = module.get(KeycloakUserService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('handleOxUserCreatedEvent', () => {
        it('should log info and call KeycloakUserService', async () => {
            const fakeOXUserID: string = faker.string.uuid();
            const fakeOXContextID: string = faker.string.uuid();
            await sut.handleOxUserCreatedEvent(
                new OxUserCreatedEvent(faker.internet.userName(), fakeOXUserID, fakeOXContextID),
            );
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Received OxUserCreatedEvent userId:${fakeOXUserID}, contextId:${fakeOXContextID}`,
            );
            expect(keycloakUserServiceMock.updateUser).toHaveBeenCalledTimes(1);
        });
    });
});

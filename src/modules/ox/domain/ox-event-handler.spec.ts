import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { OxEventHandler } from './ox-event-handler.js';
import { OxService } from './ox.service.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { CreateUserAction } from '../actions/create-user.action.js';
import { OxError } from '../../../shared/error/ox.error.js';

describe('OxEventHandler', () => {
    let module: TestingModule;

    let sut: OxEventHandler;
    let oxServiceMock: DeepMocked<OxService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                OxEventHandler,
                {
                    provide: OxService,
                    useValue: createMock<OxService>(),
                },
            ],
        }).compile();

        sut = module.get(OxEventHandler);
        oxServiceMock = module.get(OxService);
        loggerMock = module.get(ClassLogger);

        //const config: ConfigService<ServerConfig> = module.get(ConfigService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        sut.ENABLED = true;
        jest.resetAllMocks();
    });

    describe('handlePersonenkontextCreatedEvent', () => {
        let personId: PersonID;
        let orgaId: OrganisationID;
        let rolleId: RolleID;
        let event: PersonenkontextCreatedEvent;

        beforeEach(() => {
            personId = faker.string.uuid();
            orgaId = faker.string.uuid();
            rolleId = faker.string.uuid();
            event = new PersonenkontextCreatedEvent(personId, orgaId, rolleId);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            await sut.handlePersonenkontextCreatedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(oxServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log info on success', async () => {
            oxServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });
            await sut.handlePersonenkontextCreatedEvent(event);

            expect(oxServiceMock.send).toHaveBeenLastCalledWith(expect.any(CreateUserAction));
            expect(loggerMock.info).toHaveBeenLastCalledWith(`User created in OX`);
        });

        it('should log error on failure', async () => {
            oxServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: new OxError('Request failed'),
            });
            await sut.handlePersonenkontextCreatedEvent(event);

            expect(oxServiceMock.send).toHaveBeenLastCalledWith(expect.any(CreateUserAction));
            expect(loggerMock.error).toHaveBeenLastCalledWith(`Could not create user in OX, error: Request failed`);
        });
    });
});

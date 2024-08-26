import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { KlasseCreatedEvent } from '../../../shared/events/klasse-created.event.js';
import { KlasseDeletedEvent } from '../../../shared/events/klasse-deleted.event.js';
import { KlasseUpdatedEvent } from '../../../shared/events/klasse-updated.event.js';
import { SchuleCreatedEvent } from '../../../shared/events/schule-created.event.js';
import { OrganisationID } from '../../../shared/types/index.js';
import { RootDirectChildrenType } from '../../organisation/domain/organisation.enums.js';
import { CreateGroupAction } from '../actions/create-group.action.js';
import { DeleteGroupAction } from '../actions/delete-group.action.js';
import { UpdateGroupAction } from '../actions/update-group.action.js';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { ItsLearningOrganisationsEventHandler } from './itslearning-organisations.event-handler.js';

describe('ItsLearning Organisations Event Handler', () => {
    let module: TestingModule;

    let sut: ItsLearningOrganisationsEventHandler;
    let itsLearningServiceMock: DeepMocked<ItsLearningIMSESService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                ItsLearningOrganisationsEventHandler,
                {
                    provide: ItsLearningIMSESService,
                    useValue: createMock<ItsLearningIMSESService>(),
                },
            ],
        }).compile();

        sut = module.get(ItsLearningOrganisationsEventHandler);
        itsLearningServiceMock = module.get(ItsLearningIMSESService);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        sut.ENABLED = true;
        jest.resetAllMocks();
    });

    describe('createSchuleEventHandler', () => {
        it('should log on success', async () => {
            const orgaId: OrganisationID = faker.string.uuid();
            const oldParentId: OrganisationID = faker.string.uuid();
            const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                orgaId,
                faker.string.uuid(),
                faker.word.noun(),
                RootDirectChildrenType.OEFFENTLICH,
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: { parentId: oldParentId } }); // ReadGroupAction
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            }); // CreateGroupAction

            await sut.createSchuleEventHandler(event);

            expect(itsLearningServiceMock.send).toHaveBeenLastCalledWith(expect.any(CreateGroupAction));
            expect(loggerMock.info).toHaveBeenLastCalledWith(`Schule with ID ${orgaId} created.`);
        });

        it('should keep existing hierarchy', async () => {
            const oldParentId: OrganisationID = faker.string.uuid();
            const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                undefined,
                RootDirectChildrenType.OEFFENTLICH,
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: { parentId: oldParentId } }); // ReadGroupAction
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            }); // CreateGroupAction

            await sut.createSchuleEventHandler(event);

            expect(itsLearningServiceMock.send).toHaveBeenLastCalledWith(expect.any(CreateGroupAction));
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.word.noun(),
                RootDirectChildrenType.OEFFENTLICH,
            );

            await sut.createSchuleEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should skip event, if schule is ersatzschule', async () => {
            const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.word.noun(),
                RootDirectChildrenType.ERSATZ,
            );

            await sut.createSchuleEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith(`Ersatzschule, ignoring.`);
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error on failed creation', async () => {
            const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.word.noun(),
                RootDirectChildrenType.OEFFENTLICH,
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() }); // ReadGroupAction
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock<DomainError>({ message: 'Error' }),
            }); // CreateGroupAction

            await sut.createSchuleEventHandler(event);

            expect(loggerMock.error).toHaveBeenLastCalledWith(`Could not create Schule in itsLearning: Error`);
        });
    });

    describe('createKlasseEventHandler', () => {
        it('should log on success', async () => {
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: {} }); // ReadGroupAction
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            }); // CreateGroupAction

            await sut.createKlasseEventHandler(event);

            expect(itsLearningServiceMock.send).toHaveBeenLastCalledWith(expect.any(CreateGroupAction));
            expect(loggerMock.info).toHaveBeenLastCalledWith(`Klasse with ID ${event.id} created.`);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );

            await sut.createKlasseEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error, if administriertVon is undefined', async () => {
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                undefined,
            );

            await sut.createKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith('Klasse has no parent organisation. Aborting.');
        });

        it('should log error, if the klasse has no name', async () => {
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                undefined,
                faker.string.uuid(),
            );

            await sut.createKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith('Klasse has no name. Aborting.');
        });

        it('should log error, if the parent school does not exist', async () => {
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() }); // ReadGroupAction

            await sut.createKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `Parent Organisation (${event.administriertVon}) does not exist in itsLearning.`,
            );
        });

        it('should log error on failed creation', async () => {
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: {} }); // ReadGroupAction
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock<DomainError>({ message: 'Error' }),
            }); // CreateGroupAction

            await sut.createKlasseEventHandler(event);
            expect(loggerMock.error).toHaveBeenLastCalledWith('Could not create Klasse in itsLearning: Error');
        });
    });

    describe('updatedKlasseEventHandler', () => {
        it('should log on success', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: {} }); // UpdateGroupAction

            await sut.updatedKlasseEventHandler(event);

            expect(itsLearningServiceMock.send).toHaveBeenLastCalledWith(expect.any(UpdateGroupAction));
            expect(loggerMock.info).toHaveBeenLastCalledWith(`Klasse with ID ${event.organisationId} was updated.`);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );

            await sut.updatedKlasseEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error, if administriertVon is undefined', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                undefined,
            );

            await sut.updatedKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith('Klasse has no parent organisation. Aborting.');
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error, if the klasse has no name', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(faker.string.uuid(), '', faker.string.uuid());

            await sut.updatedKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith('Klasse has no name. Aborting.');
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error on failed update', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock<DomainError>({ message: 'Error' }),
            }); // UpdateGroupAction

            await sut.updatedKlasseEventHandler(event);
            expect(loggerMock.error).toHaveBeenLastCalledWith('Could not update Klasse in itsLearning: Error');
        });
    });

    describe('deletedKlasseEventHandler', () => {
        it('should log on success', async () => {
            const event: KlasseDeletedEvent = new KlasseDeletedEvent(faker.string.uuid());
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: {} }); // DeleteGroupAction

            await sut.deletedKlasseEventHandler(event);

            expect(itsLearningServiceMock.send).toHaveBeenLastCalledWith(expect.any(DeleteGroupAction));
            expect(loggerMock.info).toHaveBeenLastCalledWith(`Klasse with ID ${event.organisationId} was deleted.`);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: KlasseDeletedEvent = new KlasseDeletedEvent(faker.string.uuid());

            await sut.deletedKlasseEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should log error on failed delete', async () => {
            const event: KlasseDeletedEvent = new KlasseDeletedEvent(faker.string.uuid());
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock<DomainError>({ message: 'Error' }),
            }); // DeleteGroupAction

            await sut.deletedKlasseEventHandler(event);
            expect(loggerMock.error).toHaveBeenLastCalledWith('Could not delete Klasse in itsLearning: Error');
        });
    });
});

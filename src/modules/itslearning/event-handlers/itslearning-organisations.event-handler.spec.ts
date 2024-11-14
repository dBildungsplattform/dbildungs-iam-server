import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { KlasseCreatedEvent } from '../../../shared/events/klasse-created.event.js';
import { KlasseDeletedEvent } from '../../../shared/events/klasse-deleted.event.js';
import { KlasseUpdatedEvent } from '../../../shared/events/klasse-updated.event.js';
import { CreateGroupParams } from '../actions/create-group.params.js';
import { GroupResponse } from '../actions/read-group.action.js';
import { ItslearningGroupRepo } from '../repo/itslearning-group.repo.js';
import { ItsLearningOrganisationsEventHandler } from './itslearning-organisations.event-handler.js';

describe('ItsLearning Organisations Event Handler', () => {
    let module: TestingModule;

    let sut: ItsLearningOrganisationsEventHandler;
    let itslearningGroupRepoMock: DeepMocked<ItslearningGroupRepo>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                ItsLearningOrganisationsEventHandler,
                {
                    provide: ItslearningGroupRepo,
                    useValue: createMock<ItslearningGroupRepo>(),
                },
            ],
        }).compile();

        sut = module.get(ItsLearningOrganisationsEventHandler);
        itslearningGroupRepoMock = module.get(ItslearningGroupRepo);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        sut.ENABLED = true;
        jest.resetAllMocks();
    });

    describe('createKlasseEventHandler', () => {
        it('should log on success', async () => {
            const event: KlasseCreatedEvent = new KlasseCreatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itslearningGroupRepoMock.readGroup.mockResolvedValueOnce(createMock<GroupResponse>()); // ReadGroupAction
            itslearningGroupRepoMock.createOrUpdateGroup.mockResolvedValueOnce(undefined); // CreateGroupAction

            await sut.createKlasseEventHandler(event);

            expect(itslearningGroupRepoMock.createOrUpdateGroup).toHaveBeenLastCalledWith<[CreateGroupParams]>({
                id: event.id,
                name: event.name!,
                parentId: event.administriertVon!,
                type: 'Unspecified',
            });
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
            expect(itslearningGroupRepoMock.createOrUpdateGroup).not.toHaveBeenCalled();
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
            itslearningGroupRepoMock.readGroup.mockResolvedValueOnce(undefined); // ReadGroupAction

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
            itslearningGroupRepoMock.readGroup.mockResolvedValueOnce(createMock<GroupResponse>()); // ReadGroupAction
            itslearningGroupRepoMock.createOrUpdateGroup.mockResolvedValueOnce(
                createMock<DomainError>({ message: 'Error' }),
            ); // CreateGroupAction

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
            itslearningGroupRepoMock.readGroup.mockResolvedValueOnce(createMock<GroupResponse>()); // UpdateGroupAction

            await sut.updatedKlasseEventHandler(event);

            expect(itslearningGroupRepoMock.createOrUpdateGroup).toHaveBeenLastCalledWith<[CreateGroupParams]>({
                id: event.organisationId,
                name: event.name,
                parentId: event.administriertVon!,
                type: 'Unspecified',
            });
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
            expect(itslearningGroupRepoMock.createOrUpdateGroup).not.toHaveBeenCalled();
        });

        it('should log error, if administriertVon is undefined', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                undefined,
            );

            await sut.updatedKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith('Klasse has no parent organisation. Aborting.');
            expect(itslearningGroupRepoMock.createOrUpdateGroup).not.toHaveBeenCalled();
        });

        it('should log error, if the klasse has no name', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(faker.string.uuid(), '', faker.string.uuid());

            await sut.updatedKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenCalledWith('Klasse has no name. Aborting.');
            expect(itslearningGroupRepoMock.createOrUpdateGroup).not.toHaveBeenCalled();
        });

        it('should log error on failed update', async () => {
            const event: KlasseUpdatedEvent = new KlasseUpdatedEvent(
                faker.string.uuid(),
                faker.string.alphanumeric(),
                faker.string.uuid(),
            );
            itslearningGroupRepoMock.createOrUpdateGroup.mockResolvedValueOnce(
                createMock<DomainError>({ message: 'Error' }),
            ); // UpdateGroupAction

            await sut.updatedKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenLastCalledWith('Could not update Klasse in itsLearning: Error');
        });
    });

    describe('deletedKlasseEventHandler', () => {
        it('should log on success', async () => {
            const event: KlasseDeletedEvent = new KlasseDeletedEvent(faker.string.uuid());
            itslearningGroupRepoMock.deleteGroup.mockResolvedValueOnce(undefined); // DeleteGroupAction

            await sut.deletedKlasseEventHandler(event);

            expect(itslearningGroupRepoMock.deleteGroup).toHaveBeenLastCalledWith(event.organisationId);
            expect(loggerMock.info).toHaveBeenLastCalledWith(`Klasse with ID ${event.organisationId} was deleted.`);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: KlasseDeletedEvent = new KlasseDeletedEvent(faker.string.uuid());

            await sut.deletedKlasseEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(itslearningGroupRepoMock.deleteGroup).not.toHaveBeenCalled();
        });

        it('should log error on failed delete', async () => {
            const event: KlasseDeletedEvent = new KlasseDeletedEvent(faker.string.uuid());
            itslearningGroupRepoMock.deleteGroup.mockResolvedValueOnce(createMock<DomainError>({ message: 'Error' })); // DeleteGroupAction

            await sut.deletedKlasseEventHandler(event);

            expect(loggerMock.error).toHaveBeenLastCalledWith('Could not delete Klasse in itsLearning: Error');
        });
    });
});

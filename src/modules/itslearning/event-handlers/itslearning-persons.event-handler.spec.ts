import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { CreatePersonAction } from '../actions/create-person.action.js';
import { DeletePersonAction } from '../actions/delete-person.action.js';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { ItsLearningRoleType } from '../types/role.enum.js';
import { ItsLearningPersonsEventHandler } from './itslearning-persons.event-handler.js';

describe('ItsLearning Persons Event Handler', () => {
    let module: TestingModule;

    let sut: ItsLearningPersonsEventHandler;
    let personRepoMock: DeepMocked<PersonRepository>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let itsLearningServiceMock: DeepMocked<ItsLearningIMSESService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                ItsLearningPersonsEventHandler,
                {
                    provide: ItsLearningIMSESService,
                    useValue: createMock<ItsLearningIMSESService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
            ],
        }).compile();

        sut = module.get(ItsLearningPersonsEventHandler);
        personRepoMock = module.get(PersonRepository);
        rolleRepoMock = module.get(RolleRepo);
        personenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        itsLearningServiceMock = module.get(ItsLearningIMSESService);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        sut.ENABLED = true;
        jest.restoreAllMocks();
    });

    describe('createPersonenkontextEventHandler', () => {
        it('should call updatePerson with ID', async () => {
            const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            const updatePersonSpy: jest.SpyInstance<Promise<void>, [personId: PersonID]> = jest.spyOn(
                sut,
                'updatePerson',
            );
            updatePersonSpy.mockResolvedValueOnce(undefined);

            await sut.createPersonenkontextEventHandler(event);

            expect(updatePersonSpy).toHaveBeenCalledWith(event.personId);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            const updatePersonSpy: jest.SpyInstance<Promise<void>, [personId: PersonID]> = jest.spyOn(
                sut,
                'updatePerson',
            );

            await sut.createPersonenkontextEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(updatePersonSpy).not.toHaveBeenCalled();
        });
    });

    describe('deletePersonenkontextEventHandler', () => {
        it('should call updatePerson with ID', async () => {
            const event: PersonenkontextCreatedEvent = new PersonenkontextCreatedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            const updatePersonSpy: jest.SpyInstance<Promise<void>, [personId: PersonID]> = jest.spyOn(
                sut,
                'updatePerson',
            );
            updatePersonSpy.mockResolvedValueOnce(undefined);

            await sut.deletePersonenkontextEventHandler(event);

            expect(updatePersonSpy).toHaveBeenCalledWith(event.personId);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: PersonenkontextDeletedEvent = new PersonenkontextDeletedEvent(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            const updatePersonSpy: jest.SpyInstance<Promise<void>, [personId: PersonID]> = jest.spyOn(
                sut,
                'updatePerson',
            );

            await sut.deletePersonenkontextEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(updatePersonSpy).not.toHaveBeenCalled();
        });
    });

    describe('updatePerson', () => {
        it('should send person to itsLearning', async () => {
            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([createMock()]);
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map<string, Rolle<true>>());
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });
            const personId: string = faker.string.uuid();
            const firstName: string = faker.person.firstName();
            const lastName: string = faker.person.lastName();
            const username: string = faker.internet.userName();
            personRepoMock.findById.mockResolvedValueOnce(
                createMock<Person<true>>({ referrer: username, vorname: firstName, familienname: lastName }),
            );

            await sut.updatePerson(personId);

            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(CreatePersonAction));
        });

        it('should log error if person could not be created', async () => {
            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([createMock()]);
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map<string, Rolle<true>>());
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });
            const personId: string = faker.string.uuid();
            personRepoMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

            await sut.updatePerson(personId);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `Person with ID ${personId} could not be sent to itsLearning!`,
            );
        });

        describe('when person is invalid', () => {
            it("should log error, if person can't be found", async () => {
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([createMock()]);
                rolleRepoMock.findByIds.mockResolvedValueOnce(
                    new Map<string, Rolle<true>>([
                        [faker.string.uuid(), createMock<Rolle<true>>({ rollenart: RollenArt.LEHR })],
                    ]),
                );
                itsLearningServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: createMock(),
                });
                personRepoMock.findById.mockResolvedValueOnce(undefined);
                const personId: string = faker.string.uuid();

                await sut.updatePerson(personId);

                expect(loggerMock.error).toHaveBeenCalledWith(`Person with ID ${personId} not found.`);
            });

            it('should log error, if person has no referrer', async () => {
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([createMock()]);
                rolleRepoMock.findByIds.mockResolvedValueOnce(
                    new Map<string, Rolle<true>>([
                        [faker.string.uuid(), createMock<Rolle<true>>({ rollenart: RollenArt.LEHR })],
                    ]),
                );
                itsLearningServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: createMock(),
                });
                personRepoMock.findById.mockResolvedValueOnce(createMock<Person<true>>({ referrer: undefined }));
                const personId: string = faker.string.uuid();

                await sut.updatePerson(personId);

                expect(loggerMock.error).toHaveBeenCalledWith(`Person with ID ${personId} has no username!`);
            });
        });

        describe('when person with correct role already exists', () => {
            it('should skip creation', async () => {
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([createMock()]);
                rolleRepoMock.findByIds.mockResolvedValueOnce(
                    new Map<string, Rolle<true>>([
                        [faker.string.uuid(), createMock<Rolle<true>>({ rollenart: RollenArt.LEHR })],
                    ]),
                );
                itsLearningServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: { institutionRole: ItsLearningRoleType.STAFF },
                });

                await sut.updatePerson(faker.string.uuid());

                expect(loggerMock.info).toHaveBeenCalledWith('Person already exists with correct role');
            });
        });

        describe('when person has no personenkontexte', () => {
            it('should delete person in itsLearning', async () => {
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);

                await sut.updatePerson(faker.string.uuid());

                expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(DeletePersonAction));
            });

            it('should log info if person was deleted', async () => {
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);
                itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: undefined });

                await sut.updatePerson(faker.string.uuid());

                expect(loggerMock.info).toHaveBeenCalledWith('Person deleted.');
            });

            it('should log error if person could not be deleted', async () => {
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);
                itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

                await sut.updatePerson(faker.string.uuid());

                expect(loggerMock.error).toHaveBeenCalledWith('Could not delete person from itsLearning.');
            });
        });
    });
});

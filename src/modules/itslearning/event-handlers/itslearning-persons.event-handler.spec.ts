import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { CreatePersonAction } from '../actions/create-person.action.js';
import { DeletePersonAction } from '../actions/delete-person.action.js';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { ItsLearningRoleType } from '../types/role.enum.js';
import { ItsLearningPersonsEventHandler } from './itslearning-persons.event-handler.js';
import {
    PersonenkontextEventKontextData,
    PersonenkontextEventPersonData,
} from '../../../shared/events/personenkontext-event.types.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';

describe('ItsLearning Persons Event Handler', () => {
    let module: TestingModule;

    let sut: ItsLearningPersonsEventHandler;
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
            ],
        }).compile();

        sut = module.get(ItsLearningPersonsEventHandler);
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

    describe('handlePersonenkontextDeletedEvent', () => {
        let event: PersonenkontextDeletedEvent;

        beforeEach(() => {
            event = new PersonenkontextDeletedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.internet.userName(),
                },
                {
                    orgaId: faker.string.uuid(),
                    orgaTyp: OrganisationsTyp.SCHULE,
                    orgaKennung: faker.string.alpha({ length: 6 }),
                    rolleId: faker.string.uuid(),
                    rolle: RollenArt.LEHR,
                },
            );
        });

        it('should call updatePerson with ID and log info on success', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: createMock(),
            });

            await sut.handlePersonenkontextDeletedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received PersonenkontextDeletedEvent, personId:${event.personData.id}, orgaId:${event.kontextData.orgaId}, rolleId:${event.kontextData.rolleId}`,
            );
            expect(loggerMock.info).toHaveBeenCalledWith(`Person deleted.`);

            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(DeletePersonAction));
        });

        it('should call updatePerson with ID and log error on failure', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });

            await sut.handlePersonenkontextDeletedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received PersonenkontextDeletedEvent, personId:${event.personData.id}, orgaId:${event.kontextData.orgaId}, rolleId:${event.kontextData.rolleId}`,
            );
            expect(loggerMock.error).toHaveBeenCalledWith(`Could not delete person from itsLearning.`);
            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(DeletePersonAction));
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;

            await sut.handlePersonenkontextDeletedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
        });
    });

    describe('updatePersonenkontexteEventHandler', () => {
        it('should call updatePerson with ID', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                { id: faker.string.uuid(), vorname: faker.person.firstName(), familienname: faker.person.lastName() },
                [],
                [],
                [],
            );
            const updatePersonSpy: jest.SpyInstance<
                Promise<void>,
                [person: PersonenkontextEventPersonData, personenkontexte: PersonenkontextEventKontextData[]]
            > = jest.spyOn(sut, 'updatePerson');
            updatePersonSpy.mockResolvedValueOnce(undefined);

            await sut.updatePersonenkontexteEventHandler(event);

            expect(updatePersonSpy).toHaveBeenCalledWith(event.person, event.currentKontexte);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                { id: faker.string.uuid(), vorname: faker.person.firstName(), familienname: faker.person.lastName() },
                [],
                [],
                [],
            );
            const updatePersonSpy: jest.SpyInstance<
                Promise<void>,
                [person: PersonenkontextEventPersonData, personenkontexte: PersonenkontextEventKontextData[]]
            > = jest.spyOn(sut, 'updatePerson');
            updatePersonSpy.mockResolvedValueOnce(undefined);

            await sut.updatePersonenkontexteEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
            expect(updatePersonSpy).not.toHaveBeenCalled();
        });
    });

    describe('updatePerson', () => {
        const person: PersonenkontextEventPersonData = {
            id: faker.string.uuid(),
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            referrer: faker.internet.userName(),
        };

        it('should send person to itsLearning', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });

            await sut.updatePerson(person, [createMock()]);

            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(CreatePersonAction));
        });

        it('should log error if person could not be created', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

            await sut.updatePerson(person, [createMock()]);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `Person with ID ${person.id} could not be sent to itsLearning!`,
            );
        });

        describe('when person is invalid', () => {
            it('should log error, if person has no referrer', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({
                    ok: false,
                    error: createMock(),
                });

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { referrer, ...personWithoutReferrer }: PersonenkontextEventPersonData = person;

                await sut.updatePerson(personWithoutReferrer, [createMock()]);

                expect(loggerMock.error).toHaveBeenCalledWith(`Person with ID ${person.id} has no username!`);
            });
        });

        describe('when person with correct role already exists', () => {
            it('should skip creation', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: { institutionRole: ItsLearningRoleType.STAFF },
                });

                await sut.updatePerson(person, [
                    createMock<PersonenkontextEventKontextData>({ rolle: RollenArt.LEHR }),
                ]);

                expect(loggerMock.info).toHaveBeenCalledWith('Person already exists with correct role');
            });
        });

        describe('when person has no personenkontexte', () => {
            it('should delete person in itsLearning', async () => {
                await sut.updatePerson(person, []);

                expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(DeletePersonAction));
            });

            it('should log info if person was deleted', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: undefined });

                await sut.updatePerson(person, []);

                expect(loggerMock.info).toHaveBeenCalledWith('Person deleted.');
            });

            it('should log error if person could not be deleted', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

                await sut.updatePerson(person, []);

                expect(loggerMock.error).toHaveBeenCalledWith('Could not delete person from itsLearning.');
            });
        });
    });
});

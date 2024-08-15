import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
    PersonenkontextUpdatedPersonData,
} from '../../../shared/events/personenkontext-updated.event.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { CreateMembershipsAction } from '../actions/create-memberships.action.js';
import { CreatePersonAction } from '../actions/create-person.action.js';
import { DeleteMembershipsAction } from '../actions/delete-memberships.action.js';
import { DeletePersonAction } from '../actions/delete-person.action.js';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { IMSESInstitutionRoleType } from '../types/role.enum.js';
import { ItsLearningPersonsEventHandler } from './itslearning-persons.event-handler.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';

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
    });

    afterEach(() => {
        jest.resetAllMocks();
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
                    id: faker.string.uuid(),
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

    describe('deletePerson', () => {
        it('should delete person in itsLearning', async () => {
            //mock send success to avoid NPE
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: createMock(),
            });

            await sut.deletePerson(faker.string.uuid());

            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(DeletePersonAction));
        });

        it('should log error if person could not be deleted', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

            await sut.deletePerson(faker.string.uuid());

            expect(loggerMock.error).toHaveBeenCalledWith('Could not delete person from itsLearning.');
        });
    });

    describe('updatePerson', () => {
        const person: PersonenkontextUpdatedPersonData = {
            id: faker.string.uuid(),
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            referrer: faker.internet.userName(),
        };

        it('should send person to itsLearning', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            }); // Read person
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            }); // Send person

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
                const { referrer, ...personWithoutReferrer }: PersonenkontextUpdatedPersonData = person;

                await sut.updatePerson(personWithoutReferrer, [createMock()]);

                expect(loggerMock.error).toHaveBeenCalledWith(`Person with ID ${person.id} has no username!`);
            });
        });

        describe('when person with correct role already exists', () => {
            it('should skip creation', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({
                    ok: true,
                    value: { institutionRole: IMSESInstitutionRoleType.STAFF },
                });

                await sut.updatePerson(person, [createMock<PersonenkontextUpdatedData>({ rolle: RollenArt.LEHR })]);

                expect(loggerMock.info).toHaveBeenCalledWith('Person already exists with correct role');
            });
        });

        describe('when person has no personenkontexte', () => {
            it('should log info if person was deleted', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: undefined });

                await sut.updatePerson(person, []);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `No Personenkontexte found for Person ${person.id}, deleting from itsLearning.`,
                );
            });

            it('should return true', async () => {
                itsLearningServiceMock.send.mockResolvedValueOnce({ ok: true, value: undefined });

                const result: boolean = await sut.updatePerson(person, []);

                expect(result).toBe(true);
            });
        });
    });

    describe('removeMemberships', () => {
        const person: PersonenkontextUpdatedPersonData = {
            id: faker.string.uuid(),
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            referrer: faker.internet.userName(),
        };

        const personenkontext: PersonenkontextUpdatedData = {
            id: faker.string.uuid(),
            orgaId: faker.string.uuid(),
            rolle: faker.helpers.enumValue(RollenArt),
            rolleId: faker.string.uuid(),
        };

        it('should not do anything when nothing has to be done', async () => {
            await sut.deleteMemberships(person, []);

            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should send removed memberships to itsLearning', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.deleteMemberships(person, [personenkontext]);

            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(DeleteMembershipsAction));
        });

        it('should log error if memberships could not be deleted', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

            await sut.deleteMemberships(person, [personenkontext]);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `Error while deleting 1 memberships for person ${person.id}!`,
            );
        });
    });

    describe('addMemberships', () => {
        const person: PersonenkontextUpdatedPersonData = {
            id: faker.string.uuid(),
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            referrer: faker.internet.userName(),
        };

        const personenkontext: PersonenkontextUpdatedData = {
            id: faker.string.uuid(),
            orgaId: faker.string.uuid(),
            rolle: faker.helpers.enumValue(RollenArt),
            rolleId: faker.string.uuid(),
        };

        it('should not do anything when nothing has to be done', async () => {
            await sut.addMemberships(person, []);

            expect(itsLearningServiceMock.send).not.toHaveBeenCalled();
        });

        it('should send new memberships to itsLearning', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: true,
                value: undefined,
            });

            await sut.addMemberships(person, [personenkontext]);

            expect(itsLearningServiceMock.send).toHaveBeenCalledWith(expect.any(CreateMembershipsAction));
        });

        it('should log error if memberships could not be created', async () => {
            itsLearningServiceMock.send.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });
            itsLearningServiceMock.send.mockResolvedValueOnce({ ok: false, error: createMock() });

            await sut.addMemberships(person, [personenkontext]);

            expect(loggerMock.error).toHaveBeenCalledWith(
                `Error while creating 1 memberships for person ${person.id}!`,
            );
        });
    });

    describe('updatePersonenkontexteEventHandler', () => {
        it('should not throw', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                { id: faker.string.uuid(), vorname: faker.person.firstName(), familienname: faker.person.lastName() },
                [],
                [],
                [],
            );

            jest.spyOn(sut, 'updatePerson').mockResolvedValueOnce(true);
            jest.spyOn(sut, 'deleteMemberships').mockResolvedValueOnce(undefined);
            jest.spyOn(sut, 'addMemberships').mockResolvedValueOnce(undefined);
            jest.spyOn(sut, 'deletePerson').mockResolvedValueOnce(undefined);

            await sut.updatePersonenkontexteEventHandler(event);
        });

        it('should skip event, if not enabled', async () => {
            sut.ENABLED = false;
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                { id: faker.string.uuid(), vorname: faker.person.firstName(), familienname: faker.person.lastName() },
                [],
                [],
                [],
            );

            await sut.updatePersonenkontexteEventHandler(event);

            expect(loggerMock.info).toHaveBeenCalledWith('Not enabled, ignoring event.');
        });
    });
});

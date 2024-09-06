import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';
import { faker } from '@faker-js/faker';
import { OXContextName, OXUserName } from '../../../shared/types/ox-ids.types.js';
import { PersonID } from '../../../shared/types/index.js';
import { PersonEventHandler } from './person-event-handler.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { OxUserAttributesCreatedEvent } from '../../../shared/events/ox-user-attributes-created.event.js';
import { Person } from '../domain/person.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';

describe('PersonEventHandler', () => {
    let module: TestingModule;

    let sut: PersonEventHandler;
    let loggerMock: DeepMocked<ClassLogger>;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                PersonEventHandler,
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();

        sut = module.get(PersonEventHandler);
        loggerMock = module.get(ClassLogger);
        personRepositoryMock = module.get(PersonRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('handleOxUserCreatedEvent', () => {
        let fakePersonID: PersonID;
        let fakeKeycloakUsername: string;
        let fakeOXUserName: OXUserName;
        let fakeOXContextName: OXContextName;
        let fakeEmail: string;
        let personMock: Person<true>;

        beforeEach(() => {
            fakePersonID = faker.string.uuid();
            fakeKeycloakUsername = faker.internet.userName();
            fakeOXUserName = faker.internet.userName();
            fakeOXContextName = 'context1';
            fakeEmail = faker.internet.email();
            personMock = createMock<Person<true>>();
        });

        describe('when person can be found and successfully updated', () => {
            it('should log info', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(personMock);
                personRepositoryMock.update.mockResolvedValueOnce(personMock);

                await sut.handleOxUserAttributesCreatedEvent(
                    new OxUserAttributesCreatedEvent(
                        fakePersonID,
                        fakeKeycloakUsername,
                        fakeOXUserName,
                        fakeOXContextName,
                        fakeEmail,
                    ),
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Received OxUserAttributesCreatedEvent personId:${fakePersonID}, keycloakUsername: ${fakeKeycloakUsername}, userName:${fakeOXUserName}, contextName:${fakeOXContextName}, email:${fakeEmail}`,
                );
                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `Successfully updated email-address for person with personId:${fakePersonID}`,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(1);
            });
        });

        describe('when person cannot be found by personId', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                await sut.handleOxUserAttributesCreatedEvent(
                    new OxUserAttributesCreatedEvent(
                        fakePersonID,
                        fakeKeycloakUsername,
                        fakeOXUserName,
                        fakeOXContextName,
                        fakeEmail,
                    ),
                );

                expect(loggerMock.error).toHaveBeenLastCalledWith(
                    `Cannot find person with personId:${fakePersonID} to persist new email-address`,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(0);
            });
        });

        describe('when updating person fails', () => {
            it('should log error', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(personMock);
                personRepositoryMock.update.mockResolvedValueOnce(new EntityCouldNotBeUpdated('Person', '1'));

                await sut.handleOxUserAttributesCreatedEvent(
                    new OxUserAttributesCreatedEvent(
                        fakePersonID,
                        fakeKeycloakUsername,
                        fakeOXUserName,
                        fakeOXContextName,
                        fakeEmail,
                    ),
                );

                expect(loggerMock.error).toHaveBeenLastCalledWith(
                    `Could not update email-address for person with personId:${fakePersonID}`,
                );
                expect(personRepositoryMock.update).toHaveBeenCalledTimes(1);
            });
        });
    });
});

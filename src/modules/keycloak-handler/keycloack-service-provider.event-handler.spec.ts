import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloackServiceProviderHandler } from './keycloack-service-provider.event-handler.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
    PersonenkontextUpdatedPersonData,
} from '../../shared/events/personenkontext-updated.event.js';
import { RolleServiceProviderEntity } from '../rolle/entity/rolle-service-provider.entity.js';
import { RolleID } from '../../shared/types/aggregate-ids.types.js';
import { faker } from '@faker-js/faker';

describe('KeycloackServiceProviderHandler', () => {
    let module: TestingModule;
    let sut: KeycloackServiceProviderHandler;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                KeycloackServiceProviderHandler,
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
            ],
        }).compile();

        sut = module.get(KeycloackServiceProviderHandler);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        keycloakUserServiceMock = module.get(KeycloakUserService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should update user roles when new roles are added', async () => {
        // Arrange
        const keycloakUserIdNew: string = faker.string.uuid();
        const keycloakUserIdCurrent: string = faker.string.uuid();
        const personenkontextUpdatedEventMock: DeepMocked<PersonenkontextUpdatedEvent> =
            createMock<PersonenkontextUpdatedEvent>({
                person: {
                    keycloakUserId: faker.string.uuid(),
                } as PersonenkontextUpdatedPersonData,
                newKontexte: [{ rolleId: faker.string.uuid() } as PersonenkontextUpdatedData],
                removedKontexte: [],
                currentKontexte: [{ rolleId: faker.string.uuid() } as PersonenkontextUpdatedData],
            });

        serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson.mockResolvedValueOnce([
            {
                serviceProvider: { keycloakRole: keycloakUserIdNew },
            } as RolleServiceProviderEntity,
        ]);

        serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson.mockResolvedValueOnce([
            {
                serviceProvider: { keycloakRole: keycloakUserIdCurrent },
            } as RolleServiceProviderEntity,
        ]);

        // Act
        await sut.updatePersonenkontexteOrDeleteKCandSP(personenkontextUpdatedEventMock);

        // Assert
        expect(keycloakUserServiceMock.assignRealmRolesToUser).toHaveBeenCalledWith(
            personenkontextUpdatedEventMock.person.keycloakUserId,
            [keycloakUserIdNew],
        );
        expect(keycloakUserServiceMock.removeRealmRolesFromUser).not.toHaveBeenCalled();
    });

    it('should remove user roles when roles are removed', async () => {
        // Arrange
        const keycloakUserIdDelete: string = faker.string.uuid();
        const keycloakUserIdCurrent: string = faker.string.uuid();
        const personenkontextUpdatedEventMock: DeepMocked<PersonenkontextUpdatedEvent> =
            createMock<PersonenkontextUpdatedEvent>({
                person: {
                    keycloakUserId: faker.string.uuid(),
                } as PersonenkontextUpdatedPersonData,
                newKontexte: [],
                removedKontexte: [{ rolleId: faker.string.uuid() } as PersonenkontextUpdatedData],
                currentKontexte: [{ rolleId: faker.string.uuid() } as PersonenkontextUpdatedData],
            });

        serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson.mockResolvedValueOnce([
            {
                serviceProvider: { keycloakRole: keycloakUserIdDelete },
            } as RolleServiceProviderEntity,
        ]);

        serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson.mockResolvedValueOnce([
            {
                serviceProvider: { keycloakRole: keycloakUserIdCurrent },
            } as RolleServiceProviderEntity,
        ]);

        // Act
        await sut.updatePersonenkontexteOrDeleteKCandSP(personenkontextUpdatedEventMock);

        // Assert
        expect(keycloakUserServiceMock.removeRealmRolesFromUser).toHaveBeenCalledWith(
            personenkontextUpdatedEventMock.person.keycloakUserId,
            [keycloakUserIdDelete],
        );
        expect(keycloakUserServiceMock.assignRealmRolesToUser).not.toHaveBeenCalled();
    });

    it('should not update roles if no Keycloak user ID is present', async () => {
        // Arrange
        const personenkontextUpdatedEventMock: DeepMocked<PersonenkontextUpdatedEvent> =
            createMock<PersonenkontextUpdatedEvent>({
                person: {
                    keycloakUserId: undefined,
                } as PersonenkontextUpdatedPersonData,
                newKontexte: [{ rolleId: faker.string.uuid() } as PersonenkontextUpdatedData],
                removedKontexte: [],
                currentKontexte: [{ rolleId: faker.string.uuid() } as PersonenkontextUpdatedData],
            });

        // Act
        await sut.updatePersonenkontexteOrDeleteKCandSP(personenkontextUpdatedEventMock);

        // Assert
        expect(serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson).not.toHaveBeenCalled();
        expect(keycloakUserServiceMock.assignRealmRolesToUser).not.toHaveBeenCalled();
        expect(keycloakUserServiceMock.removeRealmRolesFromUser).not.toHaveBeenCalled();
    });
    it('should return the correct currentRolleIDs', async () => {
        // Arrange
        const rolleID = faker.string.uuid();
        const rollID2 = faker.string.uuid();
        const keycloakUserId = faker.string.uuid();
        const personenkontextUpdatedEventMock: DeepMocked<PersonenkontextUpdatedEvent> =
            createMock<PersonenkontextUpdatedEvent>({
                person: {
                    keycloakUserId: keycloakUserId,
                } as PersonenkontextUpdatedPersonData,
                newKontexte: [{ rolleId: rolleID } as PersonenkontextUpdatedData],
                removedKontexte: [],
                currentKontexte: [{ rolleId: rolleID }, { rolleId: rollID2 }] as PersonenkontextUpdatedData[],
            });

        serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson.mockResolvedValueOnce([
            {
                serviceProvider: { keycloakRole: keycloakUserId },
            } as RolleServiceProviderEntity,
        ]);

        serviceProviderRepoMock.fetchRolleServiceProvidersWithoutPerson.mockResolvedValueOnce([
            {
                serviceProvider: { keycloakRole: 'delete' },
            } as RolleServiceProviderEntity,
        ]);

        const newRolle: RolleID | undefined = personenkontextUpdatedEventMock.newKontexte?.[0]?.rolleId;
        const currentRolleIDs: RolleID[] =
            personenkontextUpdatedEventMock.currentKontexte
                ?.map((kontext: PersonenkontextUpdatedData) => kontext.rolleId)
                .filter((id: RolleID) => id && id !== newRolle) || [];

        // Act
        await sut.updatePersonenkontexteOrDeleteKCandSP(personenkontextUpdatedEventMock);

        // Assert

        expect(currentRolleIDs).toEqual([rollID2]);
    });
});

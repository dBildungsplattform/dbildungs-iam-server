import { Test, TestingModule } from '@nestjs/testing';
import { CronController } from './cron.controller.js';
import { KeycloakUserService } from '../keycloak-administration/domain/keycloak-user.service.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeycloakClientError } from '../../shared/error/keycloak-client.error.js';
import { PersonDeleteService } from '../person/person-deletion/person-delete.service.js';
import { PersonPermissions } from '../authentication/domain/person-permissions.js';
import { MissingPermissionsError } from '../../shared/error/missing-permissions.error.js';

describe('CronController', () => {
    let cronController: CronController;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personDeleteServiceMock: DeepMocked<PersonDeleteService>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: PersonDeleteService,
                    useValue: createMock<PersonDeleteService>(),
                },
            ],
            controllers: [CronController],
        }).compile();

        cronController = module.get(CronController);
        keycloakUserServiceMock = module.get(KeycloakUserService);
        personRepositoryMock = module.get(PersonRepository);
        personDeleteServiceMock = module.get(PersonDeleteService);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('/PUT cron/kopers-lock', () => {
        describe('when there are users to lock', () => {
            it('should return true when all users are successfully locked', async () => {
                const mockKeycloakIds: string[] = ['user1', 'user2', 'user3'];
                personRepositoryMock.getKoPersUserLockList.mockResolvedValueOnce(mockKeycloakIds);
                keycloakUserServiceMock.updateKeycloakUserStatus.mockResolvedValueOnce({ ok: true, value: undefined });
                keycloakUserServiceMock.updateKeycloakUserStatus.mockResolvedValueOnce({ ok: true, value: undefined });
                keycloakUserServiceMock.updateKeycloakUserStatus.mockResolvedValueOnce({ ok: true, value: undefined });

                const result: boolean = await cronController.KoPersUserLock();

                expect(result).toBe(true);
                expect(personRepositoryMock.getKoPersUserLockList).toHaveBeenCalled();
                expect(keycloakUserServiceMock.updateKeycloakUserStatus).toHaveBeenCalledTimes(mockKeycloakIds.length);
            });
        });

        describe('when there are no users to lock', () => {
            it('should return false', async () => {
                personRepositoryMock.getKoPersUserLockList.mockResolvedValueOnce([]);

                const result: boolean = await cronController.KoPersUserLock();

                expect(result).toBe(true);
                expect(personRepositoryMock.getKoPersUserLockList).toHaveBeenCalled();
            });
        });

        describe('when locking users fails', () => {
            it('should return false when at least one user fails to lock', async () => {
                const mockKeycloakIds: string[] = ['user1', 'user2'];
                personRepositoryMock.getKoPersUserLockList.mockResolvedValueOnce(mockKeycloakIds);
                keycloakUserServiceMock.updateKeycloakUserStatus.mockResolvedValueOnce({ ok: true, value: undefined });
                keycloakUserServiceMock.updateKeycloakUserStatus.mockResolvedValueOnce({
                    ok: false,
                    error: new KeycloakClientError('Could not update user status or custom attributes'),
                });

                const result: boolean = await cronController.KoPersUserLock();

                expect(result).toBe(false);
                expect(personRepositoryMock.getKoPersUserLockList).toHaveBeenCalled();
                expect(keycloakUserServiceMock.updateKeycloakUserStatus).toHaveBeenCalledTimes(mockKeycloakIds.length);
            });
        });

        describe('when an exception is thrown', () => {
            it('should throw an error when there is an internal error', async () => {
                personRepositoryMock.getKoPersUserLockList.mockImplementationOnce(() => {
                    throw new Error('Some internal error');
                });

                await expect(cronController.KoPersUserLock()).rejects.toThrow(
                    'Failed to lock users due to an internal server error.',
                );
            });
        });
    });

    describe('/PUT cron/person-without-org', () => {
        describe('when there are users to remove', () => {
            it('should return true when all users are successfully removed', async () => {
                const mockUserIds: string[] = ['user1', 'user2', 'user3'];

                personRepositoryMock.getPersonWithoutOrgDeleteList.mockResolvedValueOnce(mockUserIds);
                personDeleteServiceMock.deletePerson.mockResolvedValueOnce({ ok: true, value: undefined });
                personDeleteServiceMock.deletePerson.mockResolvedValueOnce({ ok: true, value: undefined });
                personDeleteServiceMock.deletePerson.mockResolvedValueOnce({ ok: true, value: undefined });

                const personPermissionsMock: PersonPermissions = createMock<PersonPermissions>();
                const result: boolean = await cronController.personWithoutOrgDelete(personPermissionsMock);

                expect(result).toBe(true);
                expect(personDeleteServiceMock.deletePerson).toHaveBeenCalled();
                expect(personDeleteServiceMock.deletePerson).toHaveBeenCalledTimes(mockUserIds.length);
            });
        });

        describe('when there are no users to remove', () => {
            it('should return false', async () => {
                personRepositoryMock.getPersonWithoutOrgDeleteList.mockResolvedValueOnce([]);

                const personPermissionsMock: PersonPermissions = createMock<PersonPermissions>();
                const result: boolean = await cronController.personWithoutOrgDelete(personPermissionsMock);

                expect(result).toBe(true);
                expect(personRepositoryMock.getPersonWithoutOrgDeleteList).toHaveBeenCalled();
            });
        });

        describe('when removing users fails', () => {
            it('should return false when at least one user fails to be removed', async () => {
                const mockUserIds: string[] = ['user1', 'user2', 'user3'];

                personRepositoryMock.getPersonWithoutOrgDeleteList.mockResolvedValueOnce(mockUserIds);
                personDeleteServiceMock.deletePerson.mockResolvedValueOnce({ ok: true, value: undefined });
                personDeleteServiceMock.deletePerson.mockResolvedValueOnce({
                    ok: false,
                    error: new MissingPermissionsError(''),
                });

                const personPermissionsMock: PersonPermissions = createMock<PersonPermissions>();
                const result: boolean = await cronController.personWithoutOrgDelete(personPermissionsMock);

                expect(result).toBe(false);
                expect(personRepositoryMock.getPersonWithoutOrgDeleteList).toHaveBeenCalled();
                expect(personDeleteServiceMock.deletePerson).toHaveBeenCalledTimes(mockUserIds.length);
            });
        });

        describe('when an exception is thrown', () => {
            it('should throw an error when there is an internal error', async () => {
                personRepositoryMock.getPersonWithoutOrgDeleteList.mockImplementationOnce(() => {
                    throw new Error('Some internal error');
                });

                const personPermissionsMock: PersonPermissions = createMock<PersonPermissions>();
                await expect(cronController.personWithoutOrgDelete(personPermissionsMock)).rejects.toThrow(
                    'Failed to remove users due to an internal server error.',
                );
            });
        });
    });
});

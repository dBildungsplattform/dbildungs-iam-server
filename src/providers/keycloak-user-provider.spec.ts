import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakUserProvider } from './keycloak-user-provider.js';
import { KeycloakUserService } from '../modules/keycloak-administration/domain/keycloak-user.service.js';
import { DeleteUserEvent } from '../shared/events/DeleteUserEvent.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('KeycloakUserProvider', () => {
    let provider: KeycloakUserProvider;
    let kcUserServiceMock: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KeycloakUserProvider,
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
            ],
        }).compile();

        provider = module.get<KeycloakUserProvider>(KeycloakUserProvider);
        kcUserServiceMock = module.get(KeycloakUserService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it('should handle DeleteUserEvent and call delete method of KeycloakUserService with correct userId', async () => {
        const userId: string = 'some-keycloak-user-id';
        const event: DeleteUserEvent = new DeleteUserEvent(userId);

        await provider.handleDeleteKeycloakUserEvent(event);

        expect(kcUserServiceMock.delete).toHaveBeenCalledWith(userId);
        expect(kcUserServiceMock.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle errors thrown by KeycloakUserService', async () => {
        const userId: string = 'some-keycloak-user-id';
        const event: DeleteUserEvent = new DeleteUserEvent(userId);
        kcUserServiceMock.delete.mockRejectedValueOnce(new Error('Some error'));

        await expect(provider.handleDeleteKeycloakUserEvent(event)).rejects.toThrow('Some error');
    });
});

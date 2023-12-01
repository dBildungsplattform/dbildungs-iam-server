import { User } from './user.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import { KeycloakClientError } from '../../shared/error/index.js';

describe('A new user', () => {
    const user: User = new User('', '', '');

    describe('when resetting its password', () => {
        user.resetPassword();
        it('should set its state to need saving', () => {
            expect(user.needsSaving).toBe(true);
        });
        it('should have a password set', () => {
            expect(user.newPassword).toHaveLength(10);
        });
    });
});

describe('A user who has a password set', () => {
    const user: User = new User('', '', 'abcdef');
    describe('when resetting its password', () => {
        user.resetPassword();
        it('Should have its password changed', () => {
            expect(user.newPassword).not.toBe('abcdef');
            expect(user.newPassword).toHaveLength(10);
        });
        it('should set its state to needs saving', () => {
            expect(user.needsSaving).toBe(true);
        });
    });
});

describe('A pristine user', () => {
    let kcUserServiceMock: DeepMocked<KeycloakUserService>;
    beforeEach(() => {
        kcUserServiceMock = createMock<KeycloakUserService>();
        kcUserServiceMock.create.mockResolvedValueOnce({ ok: true, value: 'abcdefgh' });
        kcUserServiceMock.resetPassword.mockResolvedValueOnce({
            ok: false,
            error: new KeycloakClientError('Could not set Password'),
        });
    });

    const pristineUser: User = new User('', 'Horst', 'Hubel');
    it("should be deleted when during creation the password can't be saved", async () => {
        await expect(pristineUser.save(kcUserServiceMock)).rejects.toThrow(new Error('Could not set Password'));
        expect(kcUserServiceMock.delete).toBeCalled();
    });
});

describe('A user with an id already set', () => {
    const user: User = new User('12345', 'mmustermann', '');

    it('should trigger no actions at all when there is no password change to be made', async () => {
        const kcUserService: DeepMocked<KeycloakUserService> = createMock<KeycloakUserService>();
        await user.save(kcUserService);
        expect(kcUserService.create).not.toHaveBeenCalled();
        expect(kcUserService.resetPassword).not.toHaveBeenCalled();
        expect(kcUserService.delete).not.toHaveBeenCalled();
    });

    it('should trigger a password reset when a new password is given', async () => {
        const kcUserService: DeepMocked<KeycloakUserService> = createMock<KeycloakUserService>();
        user.resetPassword();
        await user.save(kcUserService);
        expect(kcUserService.create).not.toHaveBeenCalled();
        expect(kcUserService.resetPassword).toHaveBeenCalledWith('12345', user.newPassword);
        expect(kcUserService.delete).not.toHaveBeenCalled();
    });
});

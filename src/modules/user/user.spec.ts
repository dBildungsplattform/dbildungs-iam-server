import { User } from './user.js';

describe('A new user', () => {
    const user: User = new User('', '', '');

    describe('when resetting its password', () => {
        user.resetPassword();
        it('should set its state to need saving', () => {
            expect(user.needsSaving);
        });
        it('should have a password set', () => {
            expect(user.newPassword).toHaveLength(10);
        });
    });
});

describe('A user which has a password set', () => {
    const user: User = new User('', '', 'abcdef');
    describe('when resetting its password', () => {
        user.resetPassword();
        it('Should have its password changed', () => {
            expect(user.newPassword).not.toBe('abcdef');
            expect(user.newPassword).toHaveLength(10);
        });
        it('should set its state to needs saving', () => {
            expect(user.needsSaving);
        });
    });
});

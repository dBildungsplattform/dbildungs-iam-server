import { MissingPermissionsError } from './missing-permissions.error.js';

describe('MissingPermissionsError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: MissingPermissionsError = new MissingPermissionsError('message');

                expect(error.message).toBe('message');
                expect(error.code).toBe('MISSING_PERMISSIONS');
            });
        });
    });
});

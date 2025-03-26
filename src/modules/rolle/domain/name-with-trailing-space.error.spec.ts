import { NameForRolleWithTrailingSpaceError } from './name-with-trailing-space.error.js';

describe('NameForRolleWithTrailingSpaceError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NameForRolleWithTrailingSpaceError = new NameForRolleWithTrailingSpaceError({});
                expect(error.message).toBe('Rolle could not be created/updated because name contains trailing space');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

import { VornameForPersonWithTrailingSpaceError } from './vorname-with-trailing-space.error.js';

describe('VornameForRolleWithTrailingSpaceError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: VornameForPersonWithTrailingSpaceError = new VornameForPersonWithTrailingSpaceError({});
                expect(error.message).toBe(
                    'Person could not be created/updated because vorname contains trailing space',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

import { FamiliennameForPersonWithTrailingSpaceError } from './familienname-with-trailing-space.error.js';

describe('FamiliennameForRolleWithTrailingSpaceError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: FamiliennameForPersonWithTrailingSpaceError =
                    new FamiliennameForPersonWithTrailingSpaceError({});
                expect(error.message).toBe(
                    'Person could not be created/updated because familienname contains trailing space',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

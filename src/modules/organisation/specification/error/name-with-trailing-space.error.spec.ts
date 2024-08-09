import { NameForOrganisationWithTrailingSpaceError } from './name-with-trailing-space.error.js';

describe('NameForOrganisationWithTrailingSpaceError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NameForOrganisationWithTrailingSpaceError = new NameForOrganisationWithTrailingSpaceError(
                    {},
                );
                expect(error.message).toBe(
                    'Organisation could not be created/updated because name contains trailing space',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

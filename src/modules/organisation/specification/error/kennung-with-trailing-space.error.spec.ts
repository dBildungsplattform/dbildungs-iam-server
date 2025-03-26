import { KennungForOrganisationWithTrailingSpaceError } from './kennung-with-trailing-space.error.js';

describe('KennungForOrganisationWithTrailingSpaceError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: KennungForOrganisationWithTrailingSpaceError =
                    new KennungForOrganisationWithTrailingSpaceError({});
                expect(error.message).toBe(
                    'Organisation could not be created/updated because kennung contains trailing space',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

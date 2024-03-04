import { RootOrganisationImmutableError } from './root-organisation-immutable.error.js';

describe('RootOrganisationImmutableError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: RootOrganisationImmutableError = new RootOrganisationImmutableError({});
                expect(error.message).toBe('The root organisation cannot be altered!');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

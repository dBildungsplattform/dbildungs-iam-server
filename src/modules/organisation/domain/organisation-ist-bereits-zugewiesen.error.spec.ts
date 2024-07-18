import { OrganisationIstBereitsZugewiesenError } from './organisation-ist-bereits-zugewiesen.error.js';

describe('OrganisationIstBereitsZugewiesenError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: OrganisationIstBereitsZugewiesenError = new OrganisationIstBereitsZugewiesenError({});
                expect(error.message).toBe('Organisation is already assigned to a Personkontext');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

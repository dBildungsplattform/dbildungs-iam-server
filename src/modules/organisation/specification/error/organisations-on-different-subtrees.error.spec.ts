import { OrganisationsOnDifferentSubtreesError } from './organisations-on-different-subtrees.error.js';

describe('OrganisationsOnDifferentSubtreesError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: OrganisationsOnDifferentSubtreesError = new OrganisationsOnDifferentSubtreesError();
                expect(error.message).toBe('Organisations can not be moved across subtrees');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

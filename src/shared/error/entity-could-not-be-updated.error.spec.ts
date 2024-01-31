import { EntityCouldNotBeUpdated } from './entity-could-not-be-updated.error.js';

describe('EntityCouldNotBeUpdated', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: EntityCouldNotBeUpdated = new EntityCouldNotBeUpdated('EntityName', '0');

                expect(error.message).toBe('EntityName with ID 0 could not be updated');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});

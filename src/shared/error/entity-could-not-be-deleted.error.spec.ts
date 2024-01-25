import { EntityCouldNotBeDeleted } from './entity-could-not-be-deleted.error.js';

describe('EntityCouldNotBeDeleted', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: EntityCouldNotBeDeleted = new EntityCouldNotBeDeleted('EntityName', '0');
                expect(error.message).toBe('EntityName with ID 0 could not be deleted');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_DELETED');
            });
        });
    });
});

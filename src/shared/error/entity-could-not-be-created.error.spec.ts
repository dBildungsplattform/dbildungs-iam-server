import { EntityCouldNotBeCreated } from './entity-could-not-be-created.error.js';

describe('EntityCouldNotBeCreated', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: EntityCouldNotBeCreated = new EntityCouldNotBeCreated('EntityName');
                expect(error.message).toBe('EntityName could not be created');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_CREATED');
            });
        });
    });
});

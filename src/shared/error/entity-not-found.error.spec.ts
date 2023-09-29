import { EntityNotFoundError } from './entity-not-found.error.js';

describe('EntityNotFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: EntityNotFoundError = new EntityNotFoundError('EntityName');
                expect(error.message).toBe('requested EntityName with the following ID was not found');
                expect(error.code).toBe('ENTITY_NOT_FOUND');
            });
        });
    });
});

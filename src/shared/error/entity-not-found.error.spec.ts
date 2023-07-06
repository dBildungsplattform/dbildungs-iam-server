import { EntityNotFoundError } from './entity-not-found.error.js';

describe('EntityNotFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: EntityNotFoundError = new EntityNotFoundError('Entity not found');
                expect(error.message).toBe('Entity not found');
                expect(error.code).toBe('ENTITY_NOT_FOUND');
            });
        });
    });
});

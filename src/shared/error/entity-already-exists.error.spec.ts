import { EntityAlreadyExistsError } from './entity-already-exists.error.js';

describe('EntityAlreadyExistsError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: EntityAlreadyExistsError = new EntityAlreadyExistsError('Entity already exists');
                expect(error.message).toBe('Entity already exists');
                expect(error.code).toBe('ENTITY_ALREADY_EXISTS');
            });
        });
    });
});

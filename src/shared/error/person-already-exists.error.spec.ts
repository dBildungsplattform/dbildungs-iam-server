import { PersonAlreadyExistsError } from './person-already-exists.error.js';

describe('PersonAlreadyExistsError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error = new PersonAlreadyExistsError('Person already exists');
                expect(error.message).toBe('Person already exists');
                expect(error.code).toBe('PERSON_ALREADY_EXISTS');
            });
        });
    });
});

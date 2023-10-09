import { PersonenkontextAlreadyExistsError } from './personenkontext-already-exists.error.js';

describe('PersonAlreadyExistsError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: PersonenkontextAlreadyExistsError = new PersonenkontextAlreadyExistsError(
                    'Personenkontext already exists',
                );
                expect(error.message).toBe('Personenkontext already exists');
                expect(error.code).toBe('PERSONENKONTEXT_ALREADY_EXISTS');
            });
        });
    });
});

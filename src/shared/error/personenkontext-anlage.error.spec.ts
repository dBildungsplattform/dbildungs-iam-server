import { PersonenkontextAnlageError } from './personenkontext-anlage.error.js';

describe('PersonenkontextAnlageError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: PersonenkontextAnlageError = new PersonenkontextAnlageError(
                    'Personenkontext could not be created',
                );
                expect(error.message).toBe('Personenkontext could not be created');
                expect(error.code).toBe('PERSONEN_KONTEXT_ANLAGE_INVALID');
            });
        });
    });
});

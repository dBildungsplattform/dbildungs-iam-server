import { NameValidationError } from './name-validation.error.js';

describe('NameValidationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message', () => {
                const error: NameValidationError = new NameValidationError('Vorname');
                expect(error.message).toBe(
                    'Vorname darf nicht mit einem Leerzeichen beginnen oder enden und darf nicht leer sein.',
                );
            });
        });
    });
});

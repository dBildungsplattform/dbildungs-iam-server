import { NameValidationError } from './name-validation.error.js';

describe('NameValidationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message', () => {
                const error: NameValidationError = new NameValidationError('Name darf nicht empty sein');
                expect(error.message).toBe('Name darf nicht empty sein');
            });
        });
    });
});

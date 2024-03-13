import { InvalidCharacterSetError } from './invalid-character-set.error.js';

describe('InvalidCharacterSetError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: InvalidCharacterSetError = new InvalidCharacterSetError('name', 'DIN-91379A');
                expect(error.message).toBe('Field name has wrong character set. Expected DIN-91379A');
                expect(error.code).toBe('INVALID_CHARACTER_SET');
            });
        });
    });
});

import { InvalidAttributeLengthError } from './invalid-attribute-length.error.js';

describe('InvalidAttributeLengthError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: InvalidAttributeLengthError = new InvalidAttributeLengthError('name');
                expect(error.message).toBe('the attribute name has an invalid length');
                expect(error.code).toBe('INVALID_ATTRIBUTE_LENGTH_ERROR');
            });
        });
    });
});

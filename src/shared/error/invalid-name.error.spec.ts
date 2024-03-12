import { InvalidNameError } from './invalid-name.error.js';

describe('InvalidNameError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: InvalidNameError = new InvalidNameError('Could not generate username');
                expect(error.message).toBe('the name is invalid: Could not generate username');
                expect(error.code).toBe('INVALID_NAME_ERROR');
            });
        });
    });
});

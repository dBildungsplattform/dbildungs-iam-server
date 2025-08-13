import { ExceedsLimitError } from './exceeds-limit.error.js';

describe('ExceedsLimitError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: ExceedsLimitError = new ExceedsLimitError('Limit Exceeded');
                expect(error.message).toBe('Limit Exceeded');
                expect(error.code).toBe('EXCEEDS_LIMIT');
            });
        });
    });
});

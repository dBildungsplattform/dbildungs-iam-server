import { OxNonRetryableError } from './ox-non-retryable.error.js';

describe('OxNonRetryableError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const msg: string = 'msg';
                const error: OxNonRetryableError = new OxNonRetryableError(msg);
                expect(error.message).toBe(msg);
                expect(error.code).toBe('OX_NON_RETRYABLE_ERROR');
            });
        });
    });
});

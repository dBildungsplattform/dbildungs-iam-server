import { MismatchedRevisionError } from './mismatched-revision.error.js';

describe('MismatchedRevisionError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: MismatchedRevisionError = new MismatchedRevisionError('message');

                expect(error.message).toBe('message');
                expect(error.code).toBe('MISMATCHED_REVISION');
            });
        });
    });
});

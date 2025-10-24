import { EmailCreationFailedError } from './email-creaton-failed.error.js';

describe('EmailCreationFailedError', () => {
    describe('constructor', () => {
        it('should set notice that address was not provided', () => {
            const error: EmailCreationFailedError = new EmailCreationFailedError('pid');
            expect(error.message).toBe(`Creating Email for spshPersonId: pid failed`);
            expect(error.code).toBe('EMAIL_CREATION_FAILED');
        });
    });
});

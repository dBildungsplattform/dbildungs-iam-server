import { EmailAddressMissingStatusError } from './email-address-missing-status.error.js';

describe('EmailAddressMissingStatusError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should create error', () => {
                const error: EmailAddressMissingStatusError = new EmailAddressMissingStatusError('x@x.de');
                expect(error.code).toBe('MISSING_STATUS');
            });
        });
    });
});

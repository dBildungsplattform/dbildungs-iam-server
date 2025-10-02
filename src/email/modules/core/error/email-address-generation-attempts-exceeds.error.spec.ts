import { EmailAddressGenerationAttemptsExceededError } from './email-address-generation-attempts-exceeds.error.js';

describe('EmailAddressGenerationAttemptsExceededError', () => {
    describe('constructor', () => {
        describe('when calling the constructor without providing address', () => {
            it('should set notice that address was not provided', () => {
                const error: EmailAddressGenerationAttemptsExceededError =
                    new EmailAddressGenerationAttemptsExceededError('x@x.de', { attempt: 5 });
                expect(error.message).toBe(`Max attempts to generate email-address exceeded for address:${'x@x.de'}`);
                expect(error.code).toBe('EMAIL_ADDRESS_GENERATION_ERROR');
            });
        });
    });
});

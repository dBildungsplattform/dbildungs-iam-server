import { EmailAddressNotFoundError } from './email-address-not-found.error.js';

describe('EmailAddressNotFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor without providing address', () => {
            it('should set notice that address was not provided', () => {
                const error: EmailAddressNotFoundError = new EmailAddressNotFoundError();
                expect(error.message).toBe(`requested EmailAddress with the address:address was not found`);
                expect(error.code).toBe('ENTITY_NOT_FOUND');
            });
        });
    });
});

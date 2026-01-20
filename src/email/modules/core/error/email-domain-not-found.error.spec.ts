import { EmailDomainNotFoundError } from './email-domain-not-found.error.js';

describe('EmailDomainNotFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor without providing domain', () => {
            it('should set notice that domain was not provided', () => {
                const error: EmailDomainNotFoundError = new EmailDomainNotFoundError();
                expect(error.message).toBe(`requested EmailDomain with the domain:domain was not found`);
                expect(error.code).toBe('ENTITY_NOT_FOUND');
            });
        });
    });
});

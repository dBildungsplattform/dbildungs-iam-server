import { EmailServerCommunicationInternalError } from './email-server-communication-internal.error.js';

describe('EmailServerCommunicationInternalError', () => {
    describe('constructor', () => {
        it('should set code and emailErrorCode', () => {
            const error: EmailServerCommunicationInternalError = new EmailServerCommunicationInternalError({
                code: 404,
                emailErrorCode: 'EMAIL_DOMAIN_NOT_FOUND',
            });
            expect(error.code).toBe(404);
            expect(error.emailErrorCode).toBe('EMAIL_DOMAIN_NOT_FOUND');
        });
    });
});

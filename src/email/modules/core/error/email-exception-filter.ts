import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { EmailDomainNotFoundError } from './email-domain-not-found.error.js';
import { EmailAddressNotFoundError } from './email-address-not-found.error.js';
import { DomainError } from '../../../../shared/error/index.js';
import { EmailAddressGenerationAttemptsExceededError } from './email-address-generation-attempts-exceeds.error.js';
import { EmailServerCommunicationInternalError } from '../../../../shared/error/email-server-communication-internal.error.js';
import { EmailCreationFailedError } from './email-creaton-failed.error.js';

@Catch(EmailDomainNotFoundError, EmailAddressNotFoundError, EmailAddressGenerationAttemptsExceededError)
export class EmailExceptionFilter implements ExceptionFilter<DomainError> {
    private readonly ERROR_MAPPINGS: Map<string, EmailServerCommunicationInternalError> = new Map([
        [
            EmailDomainNotFoundError.name,
            new EmailServerCommunicationInternalError({
                code: 404,
                emailErrorCode: 'EMAIL_DOMAIN_NOT_FOUND',
            }),
        ],
        [
            EmailAddressNotFoundError.name,
            new EmailServerCommunicationInternalError({
                code: 404,
                emailErrorCode: 'EMAIL_ADDRESS_NOT_FOUND',
            }),
        ],
        [
            EmailAddressGenerationAttemptsExceededError.name,
            new EmailServerCommunicationInternalError({
                code: 400,
                emailErrorCode: 'EMAIL_ADDRESS_GENERATION_ATTEMPTS_EXCEEDED',
            }),
        ],
        [
            EmailCreationFailedError.name,
            new EmailServerCommunicationInternalError({
                code: 500,
                emailErrorCode: 'UNKNOWN_ERROR',
            }),
        ],
    ]);

    public catch(exception: DomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const emailError: EmailServerCommunicationInternalError = this.mapDomainErrorToEmailError(exception);

        response.status(emailError.code);
        response.json(emailError);
    }

    private mapDomainErrorToEmailError(error: DomainError): EmailServerCommunicationInternalError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new EmailServerCommunicationInternalError({
                code: 500,
                emailErrorCode: 'UNKNOWN_ERROR',
            })
        );
    }
}

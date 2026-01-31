import { ArgumentsHost } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-vitest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { EmailExceptionFilter } from './email-exception-filter.js';
import { EmailDomainNotFoundError } from './email-domain-not-found.error.js';
import { EmailAddressNotFoundError } from './email-address-not-found.error.js';
import { EmailAddressGenerationAttemptsExceededError } from './email-address-generation-attempts-exceeds.error.js';
import { DomainError } from '../../../../shared/error/index.js';

describe('EmailExceptionFilter', () => {
    let filter: EmailExceptionFilter;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    beforeEach(() => {
        filter = new EmailExceptionFilter();
        responseMock = createMock(Response);
        argumentsHost = createMock<ArgumentsHost>({
            switchToHttp: () =>
                createMock<HttpArgumentsHost>({
                    getResponse: () => responseMock,
                }),
        });
    });

    describe('catch', () => {
        it('should map EmailDomainNotFoundError to correct response', () => {
            const error: EmailDomainNotFoundError = new EmailDomainNotFoundError('domain');
            filter.catch(error, argumentsHost);

            expect(responseMock.status).toHaveBeenCalledWith(404);
            expect(responseMock.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 404,
                    emailErrorCode: 'EMAIL_DOMAIN_NOT_FOUND',
                }),
            );
        });

        it('should map EmailAddressNotFoundError to correct response', () => {
            const error: EmailAddressNotFoundError = new EmailAddressNotFoundError('address');
            filter.catch(error, argumentsHost);

            expect(responseMock.status).toHaveBeenCalledWith(404);
            expect(responseMock.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 404,
                    emailErrorCode: 'EMAIL_ADDRESS_NOT_FOUND',
                }),
            );
        });

        it('should map EmailAddressGenerationAttemptsExceededError to correct response', () => {
            const error: EmailAddressGenerationAttemptsExceededError =
                new EmailAddressGenerationAttemptsExceededError();
            filter.catch(error, argumentsHost);

            expect(responseMock.status).toHaveBeenCalledWith(400);
            expect(responseMock.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 400,
                    emailErrorCode: 'EMAIL_ADDRESS_GENERATION_ATTEMPTS_EXCEEDED',
                }),
            );
        });

        it('should map unknown error to UNKNOWN_ERROR response', () => {
            // Simulate an unknown error type
            const error: object = { constructor: { name: 'SomeUnknownError' } } as object;
            filter.catch(error as DomainError, argumentsHost);

            expect(responseMock.status).toHaveBeenCalledWith(500);
            expect(responseMock.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 500,
                    emailErrorCode: 'UNKNOWN_ERROR',
                }),
            );
        });
    });
});

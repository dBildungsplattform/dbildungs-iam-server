import { ArgumentsHost } from '@nestjs/common';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { AuthenticationDomainError } from '../domain/authentication-domain.error.js';
import { AuthenticationExceptionFilter } from './authentication-exception-filter.js';
import { AuthenticationErrorI18nTypes, DbiamAuthenticationError } from './dbiam-authentication.error.js';

describe('AuthenticationExceptionFilter', () => {
    let filter: AuthenticationExceptionFilter;
    const statusCode: number = 403;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    const generalBadRequestError: DbiamAuthenticationError = new DbiamAuthenticationError({
        code: 403,
        i18nKey: AuthenticationErrorI18nTypes.AUTHENTICATION_ERROR,
    });

    beforeEach(() => {
        filter = new AuthenticationExceptionFilter();
        responseMock = createMock<Response>();
        argumentsHost = createMock<ArgumentsHost>({
            switchToHttp: () =>
                createMock<HttpArgumentsHost>({
                    getResponse: () => responseMock,
                }),
        });
    });

    describe('catch', () => {
        describe('when filter catches undefined error', () => {
            it('should throw a general AuthenticationError', () => {
                const error: AuthenticationDomainError = new AuthenticationDomainError('error', undefined);

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });
    });
});

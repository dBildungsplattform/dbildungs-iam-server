import { ArgumentsHost } from '@nestjs/common';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { RolleExceptionFilter } from './rolle-exception-filter.js';
import { DbiamRolleError, RolleErrorI18nTypes } from './dbiam-rolle.error.js';
import { RolleApiError } from './rolle-api.error.js';

describe('RolleExceptionFilter', () => {
    let filter: RolleExceptionFilter;
    const statusCode: number = 500;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    const generalBadRequestError: DbiamRolleError = new DbiamRolleError({
        code: 500,
        i18nKey: RolleErrorI18nTypes.ROLLE_ERROR,
    });

    beforeEach(() => {
        filter = new RolleExceptionFilter();
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
            it('should throw a general RolleError', () => {
                const error: RolleApiError = new RolleApiError('error', undefined);

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });
    });
});

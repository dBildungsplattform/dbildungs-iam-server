import { ArgumentsHost } from '@nestjs/common';
import { MockedObject } from 'vitest';
import { createMock, DeepMocked } from '@golevelup/ts-vitest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { MeldungExceptionFilter } from './meldung.exception-filter.js';
import { DbiamMeldungError, MeldungErrorI18nTypes } from './dbiam-meldung.error.js';
import { MeldungDomainError } from '../domain/meldung-domain.error.js';

describe('MeldungExceptionFilter', () => {
    let filter: MeldungExceptionFilter;
    const statusCode: number = 500;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: MockedObject<ArgumentsHost>;

    const generalBadRequestError: DbiamMeldungError = new DbiamMeldungError({
        code: 500,
        i18nKey: MeldungErrorI18nTypes.MELDUNG_ERROR,
    });

    beforeEach(() => {
        filter = new MeldungExceptionFilter();
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
            it('should throw a general PersonError', () => {
                const error: MeldungDomainError = new MeldungDomainError('error', undefined);

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });
    });
});

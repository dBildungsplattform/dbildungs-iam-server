import { ArgumentsHost } from '@nestjs/common';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { PersonDomainError } from '../domain/person-domain.error.js';
import { DbiamPersonError, PersonErrorI18nTypes } from './dbiam-person.error.js';
import { PersonExceptionFilter } from './person-exception-filter.js';

describe('PersonExceptionFilter', () => {
    let filter: PersonExceptionFilter;
    const statusCode: number = 500;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    const generalBadRequestError: DbiamPersonError = new DbiamPersonError({
        code: 500,
        i18nKey: PersonErrorI18nTypes.PERSON_ERROR,
    });

    beforeEach(() => {
        filter = new PersonExceptionFilter();
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
                const error: PersonDomainError = new PersonDomainError('error', undefined);

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });
    });
});

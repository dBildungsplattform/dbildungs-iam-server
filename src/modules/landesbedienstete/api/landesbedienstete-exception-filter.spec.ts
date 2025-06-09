import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';

import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { DomainError } from '../../../shared/error/index.js';
import { LandesbediensteteExceptionFilter } from './landesbedienstete-exception-filter.js';

describe('LandesbediensteteExceptionFilter', () => {
    let filter: LandesbediensteteExceptionFilter;
    const statusCode: number = 500;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    beforeEach(() => {
        filter = new LandesbediensteteExceptionFilter();
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
            it('should throw a general LandesbediensteteError', () => {
                const error: DomainError = new Error('Test Error') as DomainError;

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
            });
        });
    });
});

import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ArgumentsHost } from '@nestjs/common';

import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { DomainError } from '../../../shared/error/index.js';
import { LandesbediensteterExceptionFilter } from './landesbediensteter-exception-filter.js';

describe('LandesbediensteterExceptionFilter', () => {
    let filter: LandesbediensteterExceptionFilter;
    const statusCode: number = 500;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    beforeEach(() => {
        filter = new LandesbediensteterExceptionFilter();
        responseMock = createMock(Response);
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

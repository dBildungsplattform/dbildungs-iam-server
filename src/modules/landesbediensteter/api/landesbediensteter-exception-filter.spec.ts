import { ArgumentsHost } from '@nestjs/common';

import { DomainError } from '../../../shared/error/index.js';
import { LandesbediensteterExceptionFilter } from './landesbediensteter-exception-filter.js';
import { createArgumentsHostMock, createResponseMock } from '../../../../test/utils/http.mocks.js';
import { MockedObject } from 'vitest';
import { Response } from 'express';

describe('LandesbediensteterExceptionFilter', () => {
    let filter: LandesbediensteterExceptionFilter;
    const statusCode: number = 500;
    let responseMock: MockedObject<Response>;
    let argumentsHost: MockedObject<ArgumentsHost>;

    beforeEach(() => {
        filter = new LandesbediensteterExceptionFilter();
        responseMock = createResponseMock();
        argumentsHost = createArgumentsHostMock({ response: responseMock });
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

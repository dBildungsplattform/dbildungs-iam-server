import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { MockedObject } from 'vitest';

import { createArgumentsHostMock, createResponseMock } from '../../../../test/utils/http.mocks.js';
import { VidisApiError } from '../error/vidis-api.error.js';
import { VidisExceptionFilter } from './vidis-exception-filter.js';
import { VidisError, VidisErrorI18nTypes } from './vidis.error.js';

describe('VidisExceptionFilter', () => {
    const sut: VidisExceptionFilter = new VidisExceptionFilter();

    const statusCode: number = 500;
    const generalInternalServerError: VidisError = new VidisError({
        code: 500,
        i18nKey: VidisErrorI18nTypes.VIDIS_ERROR,
    });

    describe('catch', () => {
        it('should throw a general VidisError', () => {
            const error: VidisApiError = new VidisApiError('error');

            const responseMock: MockedObject<Response> = createResponseMock();
            const argumentsHost: MockedObject<ArgumentsHost> = createArgumentsHostMock({ response: responseMock });

            sut.catch(error, argumentsHost);

            expect(responseMock.json).toHaveBeenCalled();
            expect(responseMock.status).toHaveBeenCalledWith(statusCode);
            expect(responseMock.json).toHaveBeenCalledWith(generalInternalServerError);
        });
    });
});
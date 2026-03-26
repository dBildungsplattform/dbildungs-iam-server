import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { MockedObject } from 'vitest';
import { createArgumentsHostMock, createResponseMock } from '../../../../test/utils/http.mocks';
import { ServiceProviderError } from '../specification/error/service-provider.error';
import { ServiceProviderErrorFilter } from './service-provider-exception.filter';
import { DbiamServiceProviderError, ServiceProviderErrorI18nTypes } from './dbiam-service-provider.error';

describe('ServiceProviderErrorFilter', () => {
    const sut: ServiceProviderErrorFilter = new ServiceProviderErrorFilter();

    const statusCode: number = 500;
    const generalBadRequestError: DbiamServiceProviderError = new DbiamServiceProviderError({
        code: 500,
        i18nKey: ServiceProviderErrorI18nTypes.SERVICE_PROVIDER_ERROR,
    });

    describe('catch', () => {
        it('should throw a general PersonError', () => {
            const error: ServiceProviderError = new ServiceProviderError(
                'error',
                ServiceProviderErrorI18nTypes.SERVICE_PROVIDER_ERROR,
            );

            const responseMock: MockedObject<Response> = createResponseMock();
            const argumentsHost: MockedObject<ArgumentsHost> = createArgumentsHostMock({ response: responseMock });

            sut.catch(error, argumentsHost);

            expect(responseMock.json).toHaveBeenCalled();
            expect(responseMock.status).toHaveBeenCalledWith(statusCode);
            expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
        });
    });
});

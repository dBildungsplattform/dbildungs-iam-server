import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { RolleServiceProviderResponse } from './rolle-service-provider.response.js';

describe('CreateRollenerweiterungBodyParams', () => {
    const referenceParams: RolleServiceProviderResponse = {
        serviceProviderIds: [faker.string.uuid(), faker.string.uuid()],
    };

    it('should convert a plain object to a class of RolleServiceProviderResponse', () => {
        const incomingParams: object = {
            serviceProviderIds: referenceParams.serviceProviderIds,
        };
        const mappedParams: RolleServiceProviderResponse = plainToInstance(
            RolleServiceProviderResponse,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(RolleServiceProviderResponse);
        expect(mappedParams).toEqual(referenceParams);
    });
});

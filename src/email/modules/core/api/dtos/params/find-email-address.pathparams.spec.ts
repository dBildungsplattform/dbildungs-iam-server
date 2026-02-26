import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { FindEmailAddressPathParams } from './find-email-address.pathparams.js';

describe('FindEmailAddressPathParams', () => {
    const referenceParams: FindEmailAddressPathParams = {
        emailAddress: faker.internet.email(),
    };

    it('should convert a plain object to a class of FindEmailAddressPathParams', () => {
        const incomingParams: object = {
            emailAddress: referenceParams.emailAddress,
        };
        const mappedParams: FindEmailAddressPathParams = plainToInstance(FindEmailAddressPathParams, incomingParams);
        expect(mappedParams).toBeInstanceOf(FindEmailAddressPathParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { FindEmailAddressBySpshPersonIdPathParams } from './find-email-address-by-spsh-person-id.pathparams.js';

describe('FindEmailAddressBySpshPersonIdPathParams', () => {
    const referenceParams: FindEmailAddressBySpshPersonIdPathParams = {
        spshPersonId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of FindEmailAddressBySpshPersonIdPathParams', () => {
        const incomingParams: object = {
            spshPersonId: referenceParams.spshPersonId,
        };
        const mappedParams: FindEmailAddressBySpshPersonIdPathParams = plainToInstance(
            FindEmailAddressBySpshPersonIdPathParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(FindEmailAddressBySpshPersonIdPathParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { DeleteEmailAddressesForSpshPersonPathParams } from './delete-email-addresses-for-spsh-person.pathparams.js';

describe('DeleteEmailAddressesForSpshPersonPathParams', () => {
    const referenceParams: DeleteEmailAddressesForSpshPersonPathParams = {
        spshPersonId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of DeleteEmailAddressesForSpshPersonPathParams', () => {
        const incomingParams: object = {
            spshPersonId: referenceParams.spshPersonId,
        };
        const mappedParams: DeleteEmailAddressesForSpshPersonPathParams = plainToInstance(
            DeleteEmailAddressesForSpshPersonPathParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(DeleteEmailAddressesForSpshPersonPathParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

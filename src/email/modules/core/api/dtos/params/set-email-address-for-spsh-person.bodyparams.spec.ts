import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { SetEmailAddressForSpshPersonBodyParams } from './set-email-address-for-spsh-person.bodyparams';

describe('SetEmailAddressForSpshPersonBodyParams', () => {
    const referenceParams: SetEmailAddressForSpshPersonBodyParams = {
        spshUsername: faker.internet.userName(),
        kennungen: [faker.string.alphanumeric(5), faker.string.alphanumeric(7)],
        firstName: faker.string.uuid(),
        lastName: faker.string.uuid(),
        spshServiceProviderId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of SetEmailAddressForSpshPersonBodyParams', () => {
        const incomingParams: object = {
            spshUsername: referenceParams.spshUsername,
            kennungen: referenceParams.kennungen,
            firstName: referenceParams.firstName,
            lastName: referenceParams.lastName,
            spshServiceProviderId: referenceParams.spshServiceProviderId,
        };
        const mappedParams: SetEmailAddressForSpshPersonBodyParams = plainToInstance(
            SetEmailAddressForSpshPersonBodyParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(SetEmailAddressForSpshPersonBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

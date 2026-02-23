import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { SetEmailAddressForSpshPersonPathParams } from './set-email-address-for-spsh-person.pathparams';

describe('SetEmailAddressForSpshPersonPathParams', () => {
    const referenceParams: SetEmailAddressForSpshPersonPathParams = {
        spshPersonId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of SetEmailAddressForSpshPersonPathParams', () => {
        const incomingParams: object = {
            spshPersonId: referenceParams.spshPersonId,
        };
        const mappedParams: SetEmailAddressForSpshPersonPathParams = plainToInstance(
            SetEmailAddressForSpshPersonPathParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(SetEmailAddressForSpshPersonPathParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

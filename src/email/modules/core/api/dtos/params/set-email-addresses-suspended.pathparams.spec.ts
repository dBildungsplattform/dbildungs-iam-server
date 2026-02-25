import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { SetEmailAddressesSuspendedPathParams } from './set-email-addresses-suspended.pathparams';

describe('SetEmailAddressesSuspendedPathParams', () => {
    const referenceParams: SetEmailAddressesSuspendedPathParams = {
        spshPersonId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of SetEmailAddressesSuspendedPathParams', () => {
        const incomingParams: object = {
            spshPersonId: referenceParams.spshPersonId,
        };
        const mappedParams: SetEmailAddressesSuspendedPathParams = plainToInstance(
            SetEmailAddressesSuspendedPathParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(SetEmailAddressesSuspendedPathParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

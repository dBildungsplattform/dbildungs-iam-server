import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { AllPersonsQueryParam, VisibilityType } from './persons-query.param.js';
describe('CreatePersonBodyParams', () => {
    const referenceParams: AllPersonsQueryParam = {
        referrer: faker.string.uuid(),
        firstName: faker.person.firstName(),
        familyName: faker.person.lastName(),
        visibility: VisibilityType.JA,
    };

    it('should map to german to english properties', () => {
        const incomingParams: object = {
            referrer: referenceParams.referrer,
            vorname: referenceParams.firstName,
            familienname: referenceParams.familyName,
            sichtfreigabe: referenceParams.visibility,
        };
        const mappedParams: AllPersonsQueryParam = plainToInstance(AllPersonsQueryParam, incomingParams, {});
        expect(mappedParams).toBeInstanceOf(AllPersonsQueryParam);
        expect(mappedParams).toEqual(referenceParams);
    });
});

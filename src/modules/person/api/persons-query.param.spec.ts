import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { AllPersonsQueryParam } from './persons-query.param.js';
describe('CreatePersonBodyParams', () => {
    const referenceParams: AllPersonsQueryParam = {
        referrer: faker.string.uuid(),
        vorname: faker.person.firstName(),
        familienname: faker.person.lastName(),
    };

    it('should map to german to english properties', () => {
        const incomingParams: object = {
            referrer: referenceParams.referrer,
            vorname: referenceParams.vorname,
            familienname: referenceParams.familienname,
        };
        const mappedParams: AllPersonsQueryParam = plainToInstance(AllPersonsQueryParam, incomingParams, {});
        expect(mappedParams).toBeInstanceOf(AllPersonsQueryParam);
        expect(mappedParams).toEqual(referenceParams);
    });
});

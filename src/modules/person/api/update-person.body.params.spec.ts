import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { UpdatePersonBodyParams } from './update-person.body.params.js';

describe('UpdatePersonBodyParams', () => {
    const referenceParams: UpdatePersonBodyParams = {
        username: faker.string.uuid(),
        name: {
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
        },
        revision: '1',
    };

    it('should convert a plain object to a class of UpdatePersonBodyParams', () => {
        const incomingParams: object = {
            username: referenceParams.username,
            name: {
                vorname: referenceParams.name.vorname,
                familienname: referenceParams.name.familienname,
            },
            revision: referenceParams.revision,
        };
        const mappedParams: UpdatePersonBodyParams = plainToInstance(UpdatePersonBodyParams, incomingParams);
        expect(mappedParams).toBeInstanceOf(UpdatePersonBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

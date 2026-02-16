import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { CreateRollenerweiterungBodyParams } from './create-rollenerweiterung.body.params.js';

describe('CreateRollenerweiterungBodyParams', () => {
    const referenceParams: CreateRollenerweiterungBodyParams = {
        organisationId: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of CreateRollenerweiterungBodyParams', () => {
        const incomingParams: object = {
            organisationId: referenceParams.organisationId,
            rolleId: referenceParams.rolleId,
            serviceProviderId: referenceParams.serviceProviderId,
        };
        const mappedParams: CreateRollenerweiterungBodyParams = plainToInstance(
            CreateRollenerweiterungBodyParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(CreateRollenerweiterungBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

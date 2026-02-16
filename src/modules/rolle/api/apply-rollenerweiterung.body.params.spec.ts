import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { ApplyRollenerweiterungBodyParams } from './apply-rollenerweiterung.body.params.js';

describe('ApplyRollenerweiterungBodyParams', () => {
    const referenceParams: ApplyRollenerweiterungBodyParams = {
        addErweiterungenForRolleIds: [faker.string.uuid(), faker.string.uuid()],
        removeErweiterungenForRolleIds: [faker.string.uuid(), faker.string.uuid()],
    };

    it('should convert a plain object to a class of ApplyRollenerweiterungBodyParams', () => {
        const incomingParams: object = {
            addErweiterungenForRolleIds: referenceParams.addErweiterungenForRolleIds,
            removeErweiterungenForRolleIds: referenceParams.removeErweiterungenForRolleIds,
        };
        const mappedParams: ApplyRollenerweiterungBodyParams = plainToInstance(
            ApplyRollenerweiterungBodyParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(ApplyRollenerweiterungBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

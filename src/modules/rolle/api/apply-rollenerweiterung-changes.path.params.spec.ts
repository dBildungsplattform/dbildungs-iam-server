import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { ApplyRollenerweiterungPathParams } from './apply-rollenerweiterung-changes.path.params.js';

describe('ApplyRollenerweiterungPathParams', () => {
    const referenceParams: ApplyRollenerweiterungPathParams = {
        angebotId: faker.string.uuid(),
        organisationId: faker.string.uuid(),
    };

    it('should convert a plain object to a class of ApplyRollenerweiterungPathParams', () => {
        const incomingParams: object = {
            angebotId: referenceParams.angebotId,
            organisationId: referenceParams.organisationId,
        };
        const mappedParams: ApplyRollenerweiterungPathParams = plainToInstance(
            ApplyRollenerweiterungPathParams,
            incomingParams,
        );
        expect(mappedParams).toBeInstanceOf(ApplyRollenerweiterungPathParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

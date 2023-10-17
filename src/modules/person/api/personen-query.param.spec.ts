import { plainToInstance } from 'class-transformer';
import 'reflect-metadata';
import { PersonenQueryParam, SichtfreigabeType } from './personen-query.param.js';
import { faker } from '@faker-js/faker';

describe('PersonenQueryParam', () => {
    const referenceParams: PersonenQueryParam = {
        sichtfreigabe: SichtfreigabeType.JA,
        familienname: faker.person.lastName(),
        referrer: 'referrer',
        vorname: faker.person.firstName(),
    };

    it('should convert a plain object to a class of PersonenQueryParam', () => {
        const incomingParams: object = {
            sichtfreigabe: referenceParams.sichtfreigabe,
            familienname: referenceParams.familienname,
            referrer: referenceParams.referrer,
            vorname: referenceParams.vorname,
        };
        const mappedParams: PersonenQueryParam = plainToInstance(PersonenQueryParam, incomingParams, {});
        expect(mappedParams).toBeInstanceOf(PersonenQueryParam);
        expect(mappedParams).toEqual(referenceParams);
    });
});

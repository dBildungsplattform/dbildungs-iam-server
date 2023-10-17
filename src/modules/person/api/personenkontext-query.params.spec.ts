import { plainToInstance } from 'class-transformer';
import 'reflect-metadata';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { SichtfreigabeType } from './personen-query.param.js';
import { Personenstatus, Rolle } from '../domain/personenkontext.enums.js';

describe('PersonenkontextQueryParams', () => {
    const referenceParams: PersonenkontextQueryParams = {
        sichtfreigabe: SichtfreigabeType.JA,
        personenstatus: Personenstatus.AKTIV,
        referrer: 'referrer',
        rolle: Rolle.LERNENDER,
    };

    it('should convert a plain object to a class of PersonenkontextQueryParams', () => {
        const incomingParams: object = {
            sichtfreigabe: SichtfreigabeType.JA,
            personenstatus: Personenstatus.AKTIV,
            referrer: 'referrer',
            rolle: Rolle.LERNENDER,
        };
        const mappedParams: PersonenkontextQueryParams = plainToInstance(
            PersonenkontextQueryParams,
            incomingParams,
            {},
        );
        expect(mappedParams).toBeInstanceOf(PersonenkontextQueryParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

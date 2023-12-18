import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';

describe('UpdatePersonBodyParams', () => {
    const referenceParams: UpdatePersonBodyParams = {
        referrer: faker.string.uuid(),
        name: {
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            initialenvorname: faker.person.prefix(),
            initialenfamilienname: faker.person.suffix(),
            rufname: faker.person.fullName(),
            titel: faker.person.jobTitle(),
            anrede: [faker.person.jobTitle()],
            namenssuffix: [faker.person.suffix()],
            sortierindex: faker.person.bio(),
        },
        geburt: {
            datum: faker.date.birthdate(),
            geburtsort: faker.location.city(),
        },
        geschlecht: Geschlecht.X,
        lokalisierung: faker.location.zipCode(),
        vertrauensstufe: Vertrauensstufe.UNBE,
        auskunftssperre: false,
        revision: '1',
    };

    it('should convert a plain object to a class of UpdatePersonBodyParams', () => {
        const incomingParams: object = {
            referrer: referenceParams.referrer,
            name: {
                vorname: referenceParams.name.vorname,
                familienname: referenceParams.name.familienname,
                initialenvorname: referenceParams.name.initialenvorname,
                initialenfamilienname: referenceParams.name.initialenfamilienname,
                rufname: referenceParams.name.rufname,
                titel: referenceParams.name.titel,
                anrede: referenceParams.name.anrede,
                namenssuffix: referenceParams.name.namenssuffix,
                sortierindex: referenceParams.name.sortierindex,
            },
            geburt: {
                datum: referenceParams.geburt?.datum,
                geburtsort: referenceParams.geburt?.geburtsort,
            },
            geschlecht: referenceParams.geschlecht,
            lokalisierung: referenceParams.lokalisierung,
            vertrauensstufe: referenceParams.vertrauensstufe,
            auskunftssperre: referenceParams.auskunftssperre,
            revision: referenceParams.revision,
        };
        const mappedParams: UpdatePersonBodyParams = plainToInstance(UpdatePersonBodyParams, incomingParams);
        expect(mappedParams).toBeInstanceOf(UpdatePersonBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

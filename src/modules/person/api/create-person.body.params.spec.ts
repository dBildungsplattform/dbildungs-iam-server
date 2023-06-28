import 'reflect-metadata';
import { fakerDE as faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { PersonGender, PersonTrustLevel } from '../domain/person.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';

describe('CreatePersonBodyParams', () => {
    const referenceParams: CreatePersonBodyParams = {
        referrer: faker.string.uuid(),
        client: faker.company.name(),
        name: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            initialsFirstName: faker.person.prefix(),
            initialsLastName: faker.person.suffix(),
            nickName: faker.person.fullName(),
            title: faker.person.jobTitle(),
            salutation: [faker.person.jobTitle()],
            suffix: [faker.person.suffix()],
            sortIndex: faker.person.bio(),
        },
        birth: {
            date: faker.date.birthdate(),
            place: faker.location.city(),
        },
        gender: PersonGender.UNKNOWN,
        localization: faker.location.zipCode(),
        trustLevel: PersonTrustLevel.UNKNOWN,
        isInformationBlocked: true,
    };

    it('should map to german to english properties', () => {
        const incomingParams: object = {
            referrer: referenceParams.referrer,
            mandant: referenceParams.client,
            name: {
                vorname: referenceParams.name.firstName,
                familienname: referenceParams.name.lastName,
                initialenvorname: referenceParams.name.initialsFirstName,
                initialenfamilienname: referenceParams.name.initialsLastName,
                rufname: referenceParams.name.nickName,
                titel: referenceParams.name.title,
                anrede: referenceParams.name.salutation,
                namenssuffix: referenceParams.name.suffix,
                sortierindex: referenceParams.name.sortIndex,
            },
            geburt: {
                datum: referenceParams.birth.date,
                geburtsort: referenceParams.birth.place,
            },
            geschlecht: referenceParams.gender,
            lokalisierung: referenceParams.localization,
            vertrauensstufe: referenceParams.trustLevel,
            auskunftssperre: referenceParams.isInformationBlocked,
        };
        const mappedParams: CreatePersonBodyParams = plainToInstance(CreatePersonBodyParams, incomingParams, {});
        expect(mappedParams).toBeInstanceOf(CreatePersonBodyParams);
        expect(mappedParams).toEqual(referenceParams);
    });
});

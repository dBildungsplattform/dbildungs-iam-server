import { faker } from '@faker-js/faker';
import { PersonResponse } from './person.response.js';
import { TrustLevel } from '../domain/person.enums.js';
import { validate } from 'class-validator';
import { ValidationError } from '@nestjs/common';

describe('PersonResponse', () => {
    const personResponse: PersonResponse = {
        id: faker.string.uuid(),
        name: {
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            initialenfamilienname: faker.person.lastName(),
            initialenvorname: faker.person.firstName(),
            rufname: faker.person.middleName(),
            title: faker.string.alpha(),
            anrede: [faker.string.alpha(), faker.string.alpha()],
            namenssuffix: [],
            namenspraefix: [],
            sortierindex: 'sortierindex',
        },
        mandant: faker.string.uuid(),
        referrer: faker.string.uuid(),
        geburt: {
            datum: new Date('2022.02.02'),
            geburtsort: faker.location.country(),
        },
        geschlecht: faker.person.gender(),
        lokalisierung: faker.location.country(),
        vertrauensstufe: TrustLevel.TRUSTED,
    };

    it('should validate person response', async () => {
        const validationErrors: ValidationError[] = await validate(personResponse);
        expect(validationErrors).toHaveLength(0);
    });
});

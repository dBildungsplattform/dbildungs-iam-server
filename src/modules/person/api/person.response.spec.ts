import { faker } from '@faker-js/faker';
import { PersonLockOccasion } from '../domain/person.enums.js';
import { plainToInstance } from 'class-transformer';
import { PersonResponse } from './person.response.js';
import { UserLockParams } from '../../keycloak-administration/api/user-lock.params.js';

describe('PersonResponseDDD', () => {
    const kopersLock: UserLockParams = new UserLockParams();
    Object.assign(kopersLock, {
        personId: faker.string.uuid(),
        locked_by: 'test',
        locked_until: undefined,
        lock_occasion: PersonLockOccasion.KOPERS_GESPERRT,
        created_at: new Date().toISOString(),
    });
    const manualLock: UserLockParams = new UserLockParams();
    Object.assign(manualLock, {
        personId: faker.string.uuid(),
        locked_by: 'test',
        locked_until: undefined,
        lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
        created_at: new Date().toISOString(),
    });

    const personResponse: PersonResponse = {
        id: faker.string.uuid(),
        name: {
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
        },
        mandant: faker.string.uuid(),
        username: faker.string.uuid(),
        revision: '1',
        lastModified: faker.date.past(),
        userLock: [kopersLock, manualLock],
    };

    it('should convert plain object of person response to a class of person response', () => {
        const person: object = {
            id: personResponse.id,
            name: personResponse.name,
            mandant: personResponse.mandant,
            username: personResponse.username,
            revision: personResponse.revision,
            lastModified: personResponse.lastModified,
            userLock: personResponse.userLock,
        };
        const mappedParams: PersonResponse = plainToInstance(PersonResponse, person, {});
        expect(mappedParams).toBeInstanceOf(PersonResponse);
        expect(mappedParams).toEqual(personResponse);
    });
});

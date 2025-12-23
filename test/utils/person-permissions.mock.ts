import { fa, faker } from '@faker-js/faker';
import { PersonFields, PersonPermissions } from '../../src/modules/authentication/domain/person-permissions.js';
import { IPersonPermissions } from '../../src/shared/permissions/person-permissions.interface.js';
import { createMock, DeepMocked } from './createMock.js';

export class PersonPermissionsMock implements IPersonPermissions {
    public hasSystemrechteAtOrganisation(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public hasSystemrechtAtOrganisation(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public canModifyPerson(): Promise<boolean> {
        return Promise.resolve(true);
    }
}

export function createPersonPermissions(personFields?: Partial<PersonFields>): DeepMocked<PersonPermissions> {
    const personPermissions = createMock(PersonPermissions);
    const personFieldsWithDefaults: PersonFields  = {
        id: personFields?.id ?? faker.string.uuid(),
        keycloakUserId: personFields?.keycloakUserId ?? faker.string.uuid(),
        vorname: personFields?.vorname ?? faker.person.firstName(),
        familienname: personFields?.familienname ?? faker.person.lastName(),
        username: personFields?.username ?? faker.internet.userName(),
        updatedAt: personFields?.updatedAt ?? faker.date.past(),
    };

    Object.defineProperty(personPermissions, 'personFields', {
        get: vi.fn(() => personFieldsWithDefaults)
    });
    return personPermissions;
}

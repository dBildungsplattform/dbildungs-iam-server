import { faker } from '@faker-js/faker';
import { BaseClient, UserinfoResponse as OidcUserinfoResponse } from 'openid-client';
import { UserinfoResponse } from '../../src/modules/authentication/api/userinfo.response.js';
import { PersonFields, PersonPermissions } from '../../src/modules/authentication/domain/person-permissions.js';
import { IPersonPermissions } from '../../src/shared/permissions/person-permissions.interface.js';
import { createMock, DeepMocked } from './createMock.js';
import { PassportUser } from '../../src/modules/authentication/types/user.js';

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

export function createPersonPermissionsMock(personFields?: Partial<PersonFields>): DeepMocked<PersonPermissions> {
    const personPermissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
    personPermissions.hasSystemrechteAtOrganisation = vi.fn().mockResolvedValue(true);
    personPermissions.hasSystemrechtAtOrganisation = vi.fn().mockResolvedValue(true);
    personPermissions.canModifyPerson = vi.fn().mockResolvedValue(true);

    const personFieldsWithDefaults: PersonFields = {
        id: personFields?.id ?? faker.string.uuid(),
        keycloakUserId: personFields?.keycloakUserId ?? faker.string.uuid(),
        vorname: personFields?.vorname ?? faker.person.firstName(),
        familienname: personFields?.familienname ?? faker.person.lastName(),
        username: personFields?.username ?? faker.internet.userName(),
        updatedAt: personFields?.updatedAt ?? faker.date.past(),
    };

    Object.defineProperty(personPermissions, 'personFields', {
        get: vi.fn(() => personFieldsWithDefaults),
    });
    return personPermissions;
}

export function createUserinfoResponseMock(): DeepMocked<OidcUserinfoResponse> {
    return createMock(UserinfoResponse) as unknown as DeepMocked<OidcUserinfoResponse>;
}

export function createPassportUserMock(personPermissions?: PersonPermissions): PassportUser {
    return {
        userinfo: createUserinfoResponseMock(),
        personPermissions: () => Promise.resolve(personPermissions ?? createPersonPermissionsMock()),
        id_token: faker.string.uuid(),
        access_token: faker.string.uuid(),
        refresh_token: faker.string.uuid(),
     };
}

export function createOidcClientMock(clientFields?: Partial<BaseClient>): DeepMocked<BaseClient> {
    const client: DeepMocked<BaseClient> = {
        introspect: vi.fn().mockResolvedValue({ scope: 'openid', active: true }),
        refresh: vi.fn(),
        userinfo: vi.fn(),
    } as unknown as DeepMocked<BaseClient>;
    return Object.assign(client, clientFields);
}

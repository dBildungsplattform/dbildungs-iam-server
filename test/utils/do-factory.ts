import { faker } from '@faker-js/faker';
import { PersonDo } from '../../src/modules/person/domain/person.do.js';
import { OrganisationDo } from '../../src/modules/organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../src/modules/organisation/domain/organisation.enum.js';
import { UserDo } from '../../src/modules/keycloak-administration/domain/user.do.js';
import { PersonenkontextDo } from '../../src/modules/person/domain/personenkontext.do.js';
import { Rolle, Jahrgangsstufe, Personenstatus } from '../../src/modules/person/domain/personenkontext.enums.js';
import { DoBase } from '../../src/shared/types/do-base.js';

export class DoFactory {
    public static createMany<T extends DoBase<boolean>>(
        n: number,
        generator: (withId: boolean, props?: Partial<T>) => T,
        withId?: P,
        props?: Partial<T>,
    ): T[] {
        return Array.from({ length: n }, (_v: unknown, _k: number) => generator(withId, props));
    }

    public static createPerson<WasPersisted extends boolean>(
        withId: WasPersisted,
        props?: Partial<PersonDo<false>>,
    ): PersonDo<WasPersisted> {
        const person: PersonDo<false> = {
            keycloakUserId: faker.string.uuid(),
            client: faker.string.uuid(),
            lastName: faker.person.lastName(),
            firstName: faker.person.fullName(),
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
        };
        return Object.assign(new PersonDo<WasPersisted>(), person, props);
    }

    public static createOrganisation<WasPersisted extends boolean>(
        withId: WasPersisted,
        props?: Partial<OrganisationDo<false>>,
    ): OrganisationDo<WasPersisted> {
        const organisation: OrganisationDo<false> = {
            id: withId ? faker.string.uuid() : undefined,
            kennung: faker.lorem.word(),
            name: faker.company.name(),
            namensergaenzung: faker.company.name(),
            kuerzel: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
        };
        return Object.assign(new OrganisationDo<WasPersisted>(), organisation, props);
    }

    public static createUser<WasPersisted extends boolean>(
        withId: WasPersisted,
        props?: Partial<UserDo<WasPersisted>>,
    ): UserDo<WasPersisted> {
        const user: UserDo<false> = {
            id: withId ? faker.string.uuid() : undefined,
            createdDate: withId ? faker.date.past() : undefined,
            username: faker.internet.userName(),
            email: faker.internet.email(),
        };

        return Object.assign(new UserDo<WasPersisted>(), user, props);
    }

    public static createPersonenkontext<WasPersisted extends boolean>(
        withId: WasPersisted,
        props?: Partial<PersonenkontextDo<WasPersisted>>,
    ): PersonenkontextDo<WasPersisted> {
        const user: PersonenkontextDo<false> = {
            id: withId ? faker.string.uuid() : undefined,
            mandant: faker.string.uuid(),
            personId: faker.string.uuid(),
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
            organisation: DoFactory.createOrganisation(true),
            revision: '1',
            rolle: Rolle.LEHRENDER,
            jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
            personenstatus: Personenstatus.AKTIV,
            referrer: 'referrer',
            sichtfreigabe: true,
            loeschungZeitpunkt: faker.date.anytime(),
        };

        return Object.assign(new PersonenkontextDo<WasPersisted>(), user, props);
    }
}

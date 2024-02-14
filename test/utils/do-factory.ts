import { faker } from '@faker-js/faker';
import { UserDo } from '../../src/modules/keycloak-administration/domain/user.do.js';
import { OrganisationDo } from '../../src/modules/organisation/domain/organisation.do.js';
import { OrganisationsTyp, Traegerschaft } from '../../src/modules/organisation/domain/organisation.enums.js';
import { PersonDo } from '../../src/modules/person/domain/person.do.js';
import { PersonenkontextDo } from '../../src/modules/personenkontext/domain/personenkontext.do.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../src/modules/personenkontext/domain/personenkontext.enums.js';
import { RollenArt, RollenMerkmal } from '../../src/modules/rolle/domain/rolle.enums.js';
import { Rolle as RolleAggregate } from '../../src/modules/rolle/domain/rolle.js';
import { DoBase } from '../../src/shared/types/do-base.js';

export class DoFactory {
    public static createMany<T extends DoBase<boolean>>(
        this: void,
        n: number,
        withId: T extends DoBase<true> ? true : false,
        generate: (withId: T extends DoBase<true> ? true : false, props?: Partial<T>) => T,
        props?: Partial<T>,
    ): T[] {
        return Array.from({ length: n }, (_v: unknown, _k: number) => generate(withId, props));
    }

    public static createPerson<WasPersisted extends boolean>(
        this: void,
        withId: WasPersisted,
        props?: Partial<PersonDo<false>>,
    ): PersonDo<WasPersisted> {
        const person: PersonDo<false> = {
            keycloakUserId: faker.string.uuid(),
            mandant: faker.string.uuid(),
            familienname: faker.person.lastName(),
            vorname: faker.person.fullName(),
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
            revision: '1',
        };
        return Object.assign(new PersonDo<WasPersisted>(), person, props);
    }

    public static createOrganisation<WasPersisted extends boolean>(
        this: void,
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
            traegerschaft: Traegerschaft.SONSTIGE,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
        };
        return Object.assign(new OrganisationDo<WasPersisted>(), organisation, props);
    }

    public static createUser<WasPersisted extends boolean>(
        this: void,
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
        this: void,
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
            sichtfreigabe: SichtfreigabeType.JA,
            loeschungZeitpunkt: faker.date.anytime(),
        };

        return Object.assign(new PersonenkontextDo<WasPersisted>(), user, props);
    }

    public static createRolle<WasPersisted extends boolean>(
        this: void,
        withId: WasPersisted,
        props?: Partial<RolleAggregate<WasPersisted>>,
    ): RolleAggregate<WasPersisted> {
        const rolle: Partial<RolleAggregate<WasPersisted>> = {
            name: faker.person.jobTitle(),
            administeredBySchulstrukturknoten: faker.string.numeric(),
            rollenart: faker.helpers.enumValue(RollenArt),
            merkmale: [faker.helpers.enumValue(RollenMerkmal)],
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
        };
        return Object.assign(Object.create(RolleAggregate.prototype) as RolleAggregate<boolean>, rolle, props);
    }
}

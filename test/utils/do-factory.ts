import { faker } from '@faker-js/faker';
import { User } from '../../src/modules/keycloak-administration/domain/user.js';
import { OrganisationDo } from '../../src/modules/organisation/domain/organisation.do.js';
import { OrganisationsTyp, Traegerschaft } from '../../src/modules/organisation/domain/organisation.enums.js';
import { PersonenkontextDo } from '../../src/modules/personenkontext/domain/personenkontext.do.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../src/modules/personenkontext/domain/personenkontext.enums.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../../src/modules/rolle/domain/rolle.enums.js';
import { Rolle as RolleAggregate } from '../../src/modules/rolle/domain/rolle.js';
import { DoBase } from '../../src/shared/types/do-base.js';
import { ServiceProvider } from '../../src/modules/service-provider/domain/service-provider.js';
import {
    ServiceProviderKategorie,
    ServiceProviderTarget,
} from '../../src/modules/service-provider/domain/service-provider.enum.js';
import { Person } from '../../src/modules/person/domain/person.js';

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
        props?: Partial<Person<WasPersisted>>,
    ): Person<WasPersisted> {
        const person: Partial<Person<WasPersisted>> = {
            keycloakUserId: faker.string.uuid(),
            mandant: faker.string.uuid(),
            familienname: faker.person.lastName(),
            vorname: faker.person.fullName(),
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
            revision: '1',
        };
        return Object.assign(Object.create(Person.prototype) as Person<boolean>, person, props);
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
        props?: Partial<User<WasPersisted>>,
    ): User<WasPersisted> {
        const user: User<false> = {
            id: withId ? faker.string.uuid() : undefined,
            createdDate: withId ? faker.date.past() : undefined,
            username: faker.internet.userName(),
            email: faker.internet.email(),
        };

        return Object.assign(Object.create(User.prototype) as User<boolean>, user, props);
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
            organisationId: faker.string.uuid(),
            revision: '1',
            rolle: Rolle.LEHRENDER,
            rolleId: faker.string.uuid(),
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
            administeredBySchulstrukturknoten: faker.string.uuid(),
            rollenart: faker.helpers.enumValue(RollenArt),
            merkmale: [faker.helpers.enumValue(RollenMerkmal)],
            systemrechte: [faker.helpers.enumValue(RollenSystemRecht)],
            serviceProviderIds: [],
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
        };
        return Object.assign(Object.create(RolleAggregate.prototype) as RolleAggregate<boolean>, rolle, props);
    }

    public static createServiceProvider<WasPersisted extends boolean>(
        this: void,
        withId: WasPersisted,
        props?: Partial<ServiceProvider<WasPersisted>>,
    ): ServiceProvider<WasPersisted> {
        const serviceProvider: Partial<ServiceProvider<WasPersisted>> = {
            id: withId ? faker.string.uuid() : undefined,
            createdAt: withId ? faker.date.past() : undefined,
            updatedAt: withId ? faker.date.recent() : undefined,
            name: faker.word.noun(),
            target: ServiceProviderTarget.URL,
            url: faker.internet.url(),
            kategorie: faker.helpers.enumValue(ServiceProviderKategorie),
            logoMimeType: 'image/png',
            // 1x1 black PNG
            logo: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAACklEQVR4AWNgAAAAAgABc3UBGAAAAABJRU5ErkJggg==',
                'base64',
            ),
            providedOnSchulstrukturknoten: faker.string.uuid(),
        };
        return Object.assign(
            Object.create(ServiceProvider.prototype) as ServiceProvider<boolean>,
            serviceProvider,
            props,
        );
    }
}

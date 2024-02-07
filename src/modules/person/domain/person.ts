
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { KeycloakClientError } from '../../../shared/error/keycloak-client.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { KeycloakUserService } from '../../keycloak-administration/domain/keycloak-user.service.js';
import { User } from '../../user/user.js';
import { UserRepository } from '../../user/user.repository.js';
import { PersonNameParams } from '../api/person-name.params.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { Geschlecht, Vertrauensstufe } from './person.enums.js';

export class Person<WasPersisted extends boolean> {
    public static readonly CREATE_PERSON_DTO_MANDANT_UUID: string = '8c6a9447-c23e-4e70-8595-3bcc88a5577a';

    private constructor(
        public id: Persisted<string, WasPersisted> | undefined,
        public createdAt: Persisted<Date, WasPersisted> | undefined,
        public updatedAt: Persisted<Date, WasPersisted> | undefined,
        public keycloakUserId: string,
        public mandant: string,
        public familienname: string,
        public vorname: string,
        public revision: string,
        public referrer?: string,
        public stammorganisation?: string,
        public initialenFamilienname?: string,
        public initialenVorname?: string,
        public rufname?: string,
        public nameTitel?: string,
        public nameAnrede?: string[],
        public namePraefix?: string[],
        public nameSuffix?: string[],
        public nameSortierindex?: string,
        public geburtsdatum?: Date,
        public geburtsort?: string,
        public geschlecht?: Geschlecht,
        public lokalisierung?: string,
        public vertrauensstufe?: Vertrauensstufe,
        public auskunftssperre?: boolean,
    ) {}

    public static construct<WasPersisted extends boolean = true>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        keycloakUserId: string,
        mandant: string,
        familienname: string,
        vorname: string,
        revision: string,
        referrer?: string,
        stammorganisation?: string,
        initialenFamilienname?: string,
        initialenVorname?: string,
        rufname?: string,
        nameTitel?: string,
        nameAnrede?: string[],
        namePraefix?: string[],
        nameSuffix?: string[],
        nameSortierindex?: string,
        geburtsdatum?: Date,
        geburtsort?: string,
        geschlecht?: Geschlecht,
        lokalisierung?: string,
        vertrauensstufe?: Vertrauensstufe,
        auskunftssperre?: boolean,
    ): Person<WasPersisted> {
        return new Person(
            id,
            createdAt,
            updatedAt,
            keycloakUserId,
            mandant,
            familienname,
            vorname,
            revision,
            referrer,
            stammorganisation,
            initialenFamilienname,
            initialenVorname,
            rufname,
            nameTitel,
            nameAnrede,
            namePraefix,
            nameSuffix,
            nameSortierindex,
            geburtsdatum,
            geburtsort,
            geschlecht,
            lokalisierung,
            vertrauensstufe,
            auskunftssperre,
        );
    }

    public static async createNew(
        personRepo: PersonRepo,
        userRepository: UserRepository,
        userService: KeycloakUserService,
        name: PersonNameParams,
        revision: string,
        stammorganisation?: string,
        geburtsdatum?: Date,
        geburtsort?: string,
        geschlecht?: Geschlecht,
        lokalisierung?: string,
        vertrauensstufe?: Vertrauensstufe,
        auskunftssperre?: boolean,
    ): Promise<Person<true> | SchulConnexError> {
        let user: User;
        try {
            user = await userRepository.createUser(name.vorname, name.familienname);
            await user.save(userService);
        } catch (error) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new KeycloakClientError(`Can't save user`));
        }

        const personToCreate: Person<false> = new Person(
            undefined,
            undefined,
            undefined,
            user.id,
            Person.CREATE_PERSON_DTO_MANDANT_UUID,
            name.familienname,
            name.vorname,
            revision,
            user.username,
            stammorganisation,
            name.initialenfamilienname,
            name.initialenvorname,
            name.rufname,
            name.titel,
            name.anrede,
            name.namenspraefix,
            name.namenssuffix,
            name.sortierindex,
            geburtsdatum,
            geburtsort,
            geschlecht,
            lokalisierung,
            vertrauensstufe,
            auskunftssperre,
        );
        try {
            const createdPerson: Person<true> = await personRepo.save(personToCreate);
            return createdPerson;
        } catch (error) {
            //TODO: REMOVE KEYCLOAK USER
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                new EntityCouldNotBeCreated(`Can't save user`),
            );
        }
    }
}

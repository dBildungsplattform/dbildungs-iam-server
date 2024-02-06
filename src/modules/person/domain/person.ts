
import { KeycloakClientError } from '../../../shared/error/keycloak-client.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { KeycloakUserService } from '../../keycloak-administration/domain/keycloak-user.service.js';
import { User } from '../../user/user.js';
import { UserRepository } from '../../user/user.repository.js';
import { Geschlecht, Vertrauensstufe } from './person.enums.js';

export class Person<WasPersisted extends boolean> {
    public static readonly CREATE_PERSON_DTO_MANDANT_UUID: string = '8c6a9447-c23e-4e70-8595-3bcc88a5577a';

    private id: Persisted<string, WasPersisted> | undefined;

    private createdAt: Persisted<Date, WasPersisted> | undefined;

    private updatedAt: Persisted<Date, WasPersisted> | undefined;

    private keycloakUserId: string;

    private mandant: string;

    private familienname: string;

    private vorname: string;

    private revision: string;

    private referrer?: string;

    private stammorganisation?: string;

    private initialenFamilienname?: string;

    private initialenVorname?: string;

    private rufname?: string;

    private nameTitel?: string;

    private nameAnrede?: string[];

    private namePraefix?: string[];

    private nameSuffix?: string[];

    private nameSortierindex?: string;

    private geburtsdatum?: Date;

    private geburtsort?: string;

    private geschlecht?: Geschlecht;

    private lokalisierung?: string;

    private vertrauensstufe?: Vertrauensstufe;

    private auskunftssperre?: boolean;

    private constructor(
        id: Persisted<string, WasPersisted> | undefined,
        createdAt: Persisted<Date, WasPersisted> | undefined,
        updatedAt: Persisted<Date, WasPersisted> | undefined,
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
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.keycloakUserId = keycloakUserId;
        this.mandant = mandant;
        this.familienname = familienname;
        this.vorname = vorname;
        this.revision = revision;
        this.referrer = referrer;
        this.stammorganisation = stammorganisation;
        this.initialenFamilienname = initialenFamilienname;
        this.initialenVorname = initialenVorname;
        this.rufname = rufname;
        this.nameTitel = nameTitel;
        this.nameAnrede = nameAnrede;
        this.namePraefix = namePraefix;
        this.nameSuffix = nameSuffix;
        this.nameSortierindex = nameSortierindex;
        this.geburtsdatum = geburtsdatum;
        this.geburtsort = geburtsort;
        this.geschlecht = geschlecht;
        this.lokalisierung = lokalisierung;
        this.vertrauensstufe = vertrauensstufe;
        this.auskunftssperre = auskunftssperre;
    }

    public static async createNew(
        userRepository: UserRepository,
        userService: KeycloakUserService,
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
    ): Promise<Person<false> | SchulConnexError> {
        let user: User;
        try {
            user = await userRepository.createUser(vorname, familienname);
            await user.save(userService);
        } catch (error) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new KeycloakClientError(`Can't save user`));
        }

        return new Person(
            undefined,
            undefined,
            undefined,
            user.id,
            Person.CREATE_PERSON_DTO_MANDANT_UUID,
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
}

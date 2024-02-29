import { faker } from '@faker-js/faker';
import { DomainError, MismatchedRevisionError } from '../../../shared/error/index.js';
import { Geschlecht, Vertrauensstufe } from './person.enums.js';

type State = {
    passwordReset: boolean;
};

export class Person<WasPersisted extends boolean> {
    public static readonly CREATE_PERSON_DTO_MANDANT_UUID: string = '8c6a9447-c23e-4e70-8595-3bcc88a5577a';

    private state: State;

    private newPasswordInternal?: string;

    public readonly mandant: string;

    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public familienname: string,
        public vorname: string,
        public revision: string,
        public username?: string,
        public password?: string,
        public keycloakUserId?: string,
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
    ) {
        this.state = { passwordReset: false };
        this.newPasswordInternal = this.password;
        this.mandant = Person.CREATE_PERSON_DTO_MANDANT_UUID;
    }

    public get needsSaving(): boolean {
        return this.state.passwordReset || this.keycloakUserId === undefined;
    }

    public get newPassword(): string | undefined {
        return this.newPasswordInternal ?? undefined;
    }

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        familienname: string,
        vorname: string,
        revision: string,
        username?: string,
        password?: string,
        keycloakUserId?: string,
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
            familienname,
            vorname,
            revision,
            username,
            password,
            keycloakUserId,
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

    public static createNew(
        familienname: string,
        vorname: string,
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
    ): Person<false> {
        return new Person(
            undefined,
            undefined,
            undefined,
            familienname,
            vorname,
            '1',
            undefined,
            undefined,
            undefined,
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

    public update(
        revision: string,
        familienname?: string,
        vorname?: string,
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
    ): void | DomainError {
        if (this.revision !== revision) {
            return new MismatchedRevisionError(
                `Revision ${revision} does not match revision ${this.revision} of stored person.`,
            );
        }

        const newRevision: string = (parseInt(this.revision) + 1).toString();

        this.familienname = familienname ?? this.familienname;
        this.vorname = vorname ?? this.vorname;
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
        this.revision = newRevision;
    }

    public resetPassword(): void {
        this.newPasswordInternal = faker.string.alphanumeric({
            length: { min: 10, max: 10 },
            casing: 'mixed',
        });
        this.state.passwordReset = true;
    }
}

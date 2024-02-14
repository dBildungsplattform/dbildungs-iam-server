
import { faker } from '@faker-js/faker';
import { DomainError } from '../../../shared/error/index.js';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import { Geschlecht, Vertrauensstufe } from './person.enums.js';

type State = {
    pristine: boolean;
    passwordReset: boolean;
};

export class Person<WasPersisted extends boolean> {
    public static readonly CREATE_PERSON_DTO_MANDANT_UUID: string = '8c6a9447-c23e-4e70-8595-3bcc88a5577a';

    private state: State;

    private newPasswordInternal: string;

    private constructor(
        public id: Persisted<string, WasPersisted> | undefined,
        public createdAt: Persisted<Date, WasPersisted> | undefined,
        public updatedAt: Persisted<Date, WasPersisted> | undefined,
        public keycloakUserId: string,
        public mandant: string,
        public familienname: string,
        public vorname: string,
        public revision: string,
        public username: string,
        public password: string,
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
        this.state = { pristine: this.keycloakUserId.length == 0, passwordReset: false };
        this.newPasswordInternal = this.password;
    }

    private get needsSaving(): boolean {
        return this.state.passwordReset;
    }

    private get new(): boolean {
        return this.state.pristine;
    }

    public get newPassword(): string {
        return this.newPasswordInternal;
    }

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        keycloakUserId: string,
        mandant: string,
        familienname: string,
        vorname: string,
        revision: string,
        username: string,
        password: string,
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
            username,
            password,
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

    // Only for now until ticket 403
    public async saveUser(kcUserService: KeycloakUserService): Promise<void> {
        if (!(this.needsSaving || this.new)) {
            return;
        }

        if (this.new) {
            const userDo: UserDo<false> = {
                username: this.username,
            } as UserDo<false>;
            const creationResult: Result<string, DomainError> = await kcUserService.create(userDo);
            if (!creationResult.ok) {
                throw creationResult.error;
            }
            this.keycloakUserId = creationResult.value;
        }
        const setPasswordResult: Result<string, DomainError> = await kcUserService.resetPassword(
            this.keycloakUserId,
            this.newPassword,
        );
        if (!setPasswordResult.ok) {
            if (this.state.pristine) {
                await kcUserService.delete(this.keycloakUserId);
                this.keycloakUserId = '';
            }
            throw setPasswordResult.error;
        }
    }

    public resetPassword(): void {
        this.newPasswordInternal = faker.string.alphanumeric({
            length: { min: 10, max: 10 },
            casing: 'mixed',
        });
        this.state.passwordReset = true;
    }
}

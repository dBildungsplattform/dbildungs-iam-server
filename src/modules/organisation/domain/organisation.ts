import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { KlassenNameAnSchuleEindeutigError } from '../specification/error/klassen-name-an-schule-eindeutig.error.js';
import { NameRequiredForKlasseError } from '../specification/error/name-required-for-klasse.error.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';
import { NameRequiredForKlasse } from '../specification/name-required-for-klasse.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { NameValidator } from '../../../shared/validation/name-validator.js';
import { KennungForOrganisationWithTrailingSpaceError } from '../specification/error/kennung-with-trailing-space.error.js';
import { NameForOrganisationWithTrailingSpaceError } from '../specification/error/name-with-trailing-space.error.js';
import { OrganisationsTyp, Traegerschaft } from './organisation.enums.js';
import { SchultraegerNameEindeutigError } from '../specification/error/SchultraegerNameEindeutigError.js';

export class Organisation<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public version: Persisted<number, WasPersisted>,
        public itslearningEnabled: boolean,
        public administriertVon?: string,
        public zugehoerigZu?: string,
        public kennung?: string,
        public name?: string,
        public namensergaenzung?: string,
        public kuerzel?: string,
        public typ?: OrganisationsTyp,
        public traegerschaft?: Traegerschaft,
        public emailDomain?: string,
        public emailAdress?: string,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        version: number,
        administriertVon?: string,
        zugehoerigZu?: string,
        kennung?: string,
        name?: string,
        namensergaenzung?: string,
        kuerzel?: string,
        typ?: OrganisationsTyp,
        traegerschaft?: Traegerschaft,
        emailDomain?: string,
        emailAdress?: string,
        itslearningEnabled: boolean = false,
    ): Organisation<WasPersisted> {
        return new Organisation(
            id,
            createdAt,
            updatedAt,
            version,
            itslearningEnabled,
            administriertVon,
            zugehoerigZu,
            kennung,
            name,
            namensergaenzung,
            kuerzel,
            typ,
            traegerschaft,
            emailDomain,
            emailAdress,
        );
    }

    public static createNew(
        administriertVon?: string,
        zugehoerigZu?: string,
        kennung?: string,
        name?: string,
        namensergaenzung?: string,
        kuerzel?: string,
        typ?: OrganisationsTyp,
        traegerschaft?: Traegerschaft,
        emailDomain?: string,
        emailAdress?: string,
        itslearningEnabled: boolean = false,
    ): Organisation<false> | DomainError {
        const organisation: Organisation<false> = new Organisation(
            undefined,
            undefined,
            undefined,
            undefined,
            itslearningEnabled,
            administriertVon,
            zugehoerigZu,
            kennung,
            name,
            namensergaenzung,
            kuerzel,
            typ,
            traegerschaft,
            emailDomain,
            emailAdress,
        );

        const validationError: void | OrganisationSpecificationError = organisation.validateFieldNames();
        if (validationError) {
            return validationError;
        }

        return organisation;
    }

    public async checkKlasseSpecifications(
        organisationRepository: OrganisationRepository,
    ): Promise<undefined | OrganisationSpecificationError> {
        const validationError: void | OrganisationSpecificationError = this.validateFieldNames();
        if (validationError) {
            return validationError;
        }
        const nameRequiredForKlasse: NameRequiredForKlasse = new NameRequiredForKlasse();
        if (!(await nameRequiredForKlasse.isSatisfiedBy(this))) {
            return new NameRequiredForKlasseError();
        }
        //Refactor this to use KlassenNameAnSchuleEindeutig when ticket SPSH-738 is merged
        if (!(await this.validateClassNameIsUniqueOnSchool(organisationRepository))) {
            return new KlassenNameAnSchuleEindeutigError(this.id ?? undefined);
        }

        return undefined;
    }

    public async checkSchultraegerSpecifications(
        organisationRepository: OrganisationRepository,
    ): Promise<undefined | OrganisationSpecificationError> {
        const validationError: void | OrganisationSpecificationError = this.validateFieldNames();
        if (validationError) {
            return validationError;
        }

        // The name is unique among other Schulträger under Land
        if (!(await this.validateSchultraegerNameIsUnique(organisationRepository))) {
            if (this.id) {
                return new SchultraegerNameEindeutigError(this.id ?? undefined);
            }
        }

        return undefined;
    }

    private async validateClassNameIsUniqueOnSchool(organisationRepository: OrganisationRepository): Promise<boolean> {
        if (this.typ !== OrganisationsTyp.KLASSE) return true;
        if (!this.administriertVon) return false;
        const parent: Option<Organisation<true>> = await organisationRepository.findById(this.administriertVon);
        if (!parent) return false;
        //check that parent is of type SCHULE is done in a different specification
        const otherChildOrgas: Organisation<true>[] = await organisationRepository.findChildOrgasForIds([parent.id]);
        for (const otherChildOrga of otherChildOrgas) {
            if (otherChildOrga.typ === OrganisationsTyp.KLASSE) {
                if (otherChildOrga.name === this.name) return false; //not satisfied if another Klasse already has same name
            }
        }
        return true;
    }

    private async validateSchultraegerNameIsUnique(organisationRepository: OrganisationRepository): Promise<boolean> {
        // Only validate for Schulträger
        if (this.typ !== OrganisationsTyp.TRAEGER) return true;

        if (!this.name) return false; // Name is required for Schulträger

        // Step 1: Find the root children (oeffentlich and ersatz)
        const [oeffentlich, ersatz]: [Organisation<true> | undefined, Organisation<true> | undefined] =
            await organisationRepository.findRootDirectChildren();

        // Step 2: Retrieve all child organizations of the root children. Schulen could also be under Land so we need to filter out everything that is not of Type TRAEGER after this
        const rootChildrenIds: string[] = [];
        if (oeffentlich) rootChildrenIds.push(oeffentlich.id);
        if (ersatz) rootChildrenIds.push(ersatz.id);

        const allChildOrgas: Organisation<true>[] = await organisationRepository.findChildOrgasForIds(rootChildrenIds);

        // Step 3: Check if any child organization is a Schulträger with the same name
        for (const childOrga of allChildOrgas) {
            if (childOrga.typ === OrganisationsTyp.TRAEGER && childOrga.id !== this.id) {
                if (childOrga.name === this.name) {
                    return false;
                }
            }
        }

        return true; // Name is unique
    }

    private validateFieldNames(): void | OrganisationSpecificationError {
        if (this.name && !NameValidator.isNameValid(this.name)) {
            return new NameForOrganisationWithTrailingSpaceError();
        }

        if (this.kennung && !NameValidator.isNameValid(this.kennung)) {
            return new KennungForOrganisationWithTrailingSpaceError();
        }

        return undefined;
    }

    public setVersionForUpdate(version: number): void {
        this.version = version;
    }
}

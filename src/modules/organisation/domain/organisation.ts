import { DomainError } from '../../../shared/error/domain.error.js';
import { NameValidationError } from '../../../shared/error/name-validation.error.js';
import { OrganisationsTyp, Traegerschaft } from './organisation.enums.js';

export class Organisation<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public administriertVon?: string,
        public zugehoerigZu?: string,
        public kennung?: string,
        public name?: string,
        public namensergaenzung?: string,
        public kuerzel?: string,
        public typ?: OrganisationsTyp,
        public traegerschaft?: Traegerschaft,
    ) {}

    private static validateName(name: string, fieldName: string): Option<DomainError> {
        const NO_LEADING_TRAILING_WHITESPACE: RegExp = /^(?! ).*(?<! )$/;
        if (!NO_LEADING_TRAILING_WHITESPACE.test(name) || name.trim().length === 0) {
            return new NameValidationError(fieldName);
        }
        return null;
    }

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        administriertVon?: string,
        zugehoerigZu?: string,
        kennung?: string,
        name?: string,
        namensergaenzung?: string,
        kuerzel?: string,
        typ?: OrganisationsTyp,
        traegerschaft?: Traegerschaft,
    ): Organisation<WasPersisted> {
        return new Organisation(
            id,
            createdAt,
            updatedAt,
            administriertVon,
            zugehoerigZu,
            kennung,
            name,
            namensergaenzung,
            kuerzel,
            typ,
            traegerschaft,
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
    ): Organisation<false> | DomainError {
        if (name) {
            const organisationsnameValidationError: Option<DomainError> = this.validateName(
                name,
                'Der Organisationsname',
            );
            if (organisationsnameValidationError) {
                return organisationsnameValidationError;
            }
        }
        if (kennung) {
            const kennungValidationError: Option<DomainError> = this.validateName(kennung, 'Die Dienstellennummer');
            if (kennungValidationError) {
                return kennungValidationError;
            }
        }
        return new Organisation(
            undefined,
            undefined,
            undefined,
            administriertVon,
            zugehoerigZu,
            kennung,
            name,
            namensergaenzung,
            kuerzel,
            typ,
            traegerschaft,
        );
    }
}

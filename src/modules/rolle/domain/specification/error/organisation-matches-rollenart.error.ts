import { PersonenkontextSpecificationErrorI18nTypes } from '../../../../personenkontext/api/dbiam-personenkontext.error.js';
import { PersonenkontextSpecificationError } from '../../../../personenkontext/specification/error/personenkontext-specification.error.js';

export class OrganisationMatchesRollenartError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updates because it violates ${PersonenkontextSpecificationErrorI18nTypes.ORGANISATION_MATCHES_ROLLENART} specification`,
            details,
        );
    }
}

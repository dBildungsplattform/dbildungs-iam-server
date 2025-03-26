import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';
import { PersonenkontextSpecificationErrorI18nTypes } from '../../api/dbiam-personenkontext.error.js';

export class OrganisationMatchesRollenartError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updates because it violates ${PersonenkontextSpecificationErrorI18nTypes.ORGANISATION_MATCHES_ROLLENART} specification`,
            details,
        );
    }
}

import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';
import { PersonenkontextSpecificationErrorI18nTypes } from '../../api/dbiam-personenkontext.error.js';

export class RolleNurAnPassendeOrganisationError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updated because it violates ${PersonenkontextSpecificationErrorI18nTypes.ROLLE_NUR_AN_PASSENDE_ORGANISATION} specification`,
            details,
        );
    }
}

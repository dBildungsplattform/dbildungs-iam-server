import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';
import { PersonenkontextSpecificationErrorI18nTypes } from '../../api/dbiam-personenkontext.error.js';

export class GleicheRolleAnKlasseWieSchuleError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updates because it violates ${PersonenkontextSpecificationErrorI18nTypes.GLEICHE_ROLLE_AN_KLASSE_WIE_SCHULE} specification`,
            details,
        );
    }
}

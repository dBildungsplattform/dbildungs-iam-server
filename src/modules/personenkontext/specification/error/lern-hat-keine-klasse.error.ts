import { PersonenkontextSpecificationErrorI18nTypes } from '../../api/dbiam-personenkontext.error.js';
import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';

export class LernHatKeineKlasseError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updates because it violates ${PersonenkontextSpecificationErrorI18nTypes.LERN_HAT_KEINE_KLASSE} specification`,
            details,
        );
    }
}

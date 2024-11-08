import { RolleSpecificationError } from './rolle-specification.error.js';
import { RolleErrorI18nTypes } from '../../api/dbiam-rolle.error.js';

export class RolleNameNotUniqueOnSskError extends RolleSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Rolle could not be created/updated because it violates ${RolleErrorI18nTypes.ROLLE_NAME_UNIQUE_ON_SSK} specification`,
            details,
        );
    }
}

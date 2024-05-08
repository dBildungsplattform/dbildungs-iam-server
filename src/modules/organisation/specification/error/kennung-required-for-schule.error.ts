import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class KennungRequiredForSchuleError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Schule could not be created/updated because kennung is required`, undefined, details);
    }
}

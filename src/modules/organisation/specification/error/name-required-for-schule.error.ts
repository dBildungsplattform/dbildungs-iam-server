import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class NameRequiredForSchuleError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Schule could not be created/updated because name is required`, undefined, details);
    }
}

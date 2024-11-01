import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class NameRequiredForKlasseError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Klasse could not be created/updated because name is required`, undefined, details);
    }
}

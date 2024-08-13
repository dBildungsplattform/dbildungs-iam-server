import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class NameForOrganisationWithTrailingSpaceError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Organisation could not be created/updated because name contains trailing space`, undefined, details);
    }
}

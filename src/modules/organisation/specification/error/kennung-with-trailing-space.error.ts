import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class KennungForOrganisationWithTrailingSpaceError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Organisation could not be created/updated because kennung contains trailing space`, undefined, details);
    }
}

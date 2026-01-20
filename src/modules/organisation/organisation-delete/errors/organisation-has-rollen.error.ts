import { OrganisationSpecificationError } from '../../specification/error/organisation-specification.error.js';

export class OrganisationHasRollenError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Organisation Entity could not be deleted because it is referenced by rollen`, undefined, details);
    }
}

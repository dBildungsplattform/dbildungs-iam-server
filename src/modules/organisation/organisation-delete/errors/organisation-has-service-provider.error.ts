import { OrganisationSpecificationError } from '../../specification/error/organisation-specification.error.js';

export class OrganisationHasServiceProvidersError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation Entity could not be deleted because it is referenced by service-providers`,
            undefined,
            details,
        );
    }
}

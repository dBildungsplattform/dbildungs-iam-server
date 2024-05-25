import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class RootOrganisationImmutableError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('The root organisation cannot be altered!', undefined, details);
    }
}

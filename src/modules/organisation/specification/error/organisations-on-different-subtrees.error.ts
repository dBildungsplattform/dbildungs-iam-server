import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class OrganisationsOnDifferentSubtreesError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Organisations can not be moved across subtrees', undefined, details);
    }
}

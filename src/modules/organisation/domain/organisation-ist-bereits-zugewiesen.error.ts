import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';

export class OrganisationIstBereitsZugewiesenError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Organisation is already assigned to a Personkontext', undefined, details);
    }
}

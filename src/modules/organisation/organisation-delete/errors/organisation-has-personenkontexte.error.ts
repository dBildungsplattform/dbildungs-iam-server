import { OrganisationSpecificationError } from '../../specification/error/organisation-specification.error.js';

export class OrganisationHasPersonenkontexteError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation Entity could not be deleted because it is referenced in personenkontexte`,
            undefined,
            details,
        );
    }
}

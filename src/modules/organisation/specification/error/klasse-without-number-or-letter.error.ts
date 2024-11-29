import { OrganisationSpecificationError } from './organisation-specification.error.js';

export class KlasseWithoutNumberOrLetterError extends OrganisationSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation could not be created/updated because the name doesn't contain at least a letter or number`,
            undefined,
            details,
        );
    }
}

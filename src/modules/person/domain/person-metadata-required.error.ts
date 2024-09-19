import { PersonDomainError } from './person-domain.error.js';

export class PersonMetadataRequiredError extends PersonDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Person could not be created/updated because one of the properties missing familienname, vorname, personalnummer is required`,
            undefined,
            details,
        );
    }
}

import { PersonDomainError } from './person-domain.error.js';

export class VornameForPersonWithTrailingSpaceError extends PersonDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Person could not be created/updated because vorname contains trailing space`, undefined, details);
    }
}

import { PersonDomainError } from './person-domain.error.js';

export class FamiliennameForPersonWithTrailingSpaceError extends PersonDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Person could not be created/updated because familienname contains trailing space`, undefined, details);
    }
}

import { RolleDomainError } from './rolle-domain.error.js';

export class NameForRolleWithTrailingSpaceError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Rolle could not be created/updated because name contains trailing space`, undefined, details);
    }
}

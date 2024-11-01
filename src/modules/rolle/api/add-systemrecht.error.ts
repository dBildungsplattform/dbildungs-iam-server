import { RolleDomainError } from '../domain/rolle-domain.error.js';

export class AddSystemrechtError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Adding systemrecht to rolle failed.', undefined, details);
    }
}

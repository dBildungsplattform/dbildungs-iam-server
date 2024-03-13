import { DomainError } from './index.js';

export class AddSystemrechtError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super('Adding systemrecht to rolle failed.', 'SYSTEMRECHT_COULD_NOT_BE_ADDED_TO_ROLLE', details);
    }
}

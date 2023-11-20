import { DomainError } from './domain.error.js';

export class MismatchedRevisionError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'MISMATCHED_REVISION', details);
    }
}

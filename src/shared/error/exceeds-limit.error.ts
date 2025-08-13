import { DomainError } from './domain.error.js';

export class ExceedsLimitError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'EXCEEDS_LIMIT', details);
    }
}

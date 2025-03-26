import { DomainError } from './domain.error.js';

export class DuplicatePersonalnummerError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSONALNUMMER_ALREADY_EXISTS', details);
    }
}

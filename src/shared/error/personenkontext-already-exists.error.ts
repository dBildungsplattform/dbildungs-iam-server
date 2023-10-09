import { DomainError } from './domain.error.js';

export class PersonenkontextAlreadyExistsError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSONENKONTEXT_ALREADY_EXISTS', details);
    }
}

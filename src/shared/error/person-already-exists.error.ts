import { DomainError } from './domain.error.js';

export class PersonAlreadyExistsError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSON_ALREADY_EXISTS', details);
    }
}

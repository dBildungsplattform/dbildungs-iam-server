import { DomainError } from './domain.error.js';

export class PersonDoesNotExistError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSON_NOT_FOUND', details);
    }
}

import { DomainError } from './domain.error.js';

export class PersonMissingUsernameError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSON_USERNAME_MISSING', details);
    }
}

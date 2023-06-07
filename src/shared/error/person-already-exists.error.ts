import { DomainError } from './domain.error.js';

export class PersonAlreadyExistsError extends DomainError {
    public constructor(name: string, details?: unknown[] | Record<string, unknown>) {
        super(`Person with name ${name} already exist`, 'PERSON_ALREADY_EXISTS', details);
    }
}

import { SharedDomainError } from './index.js';

export class PersonAlreadyExistsError extends SharedDomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSON_ALREADY_EXISTS', details);
    }
}

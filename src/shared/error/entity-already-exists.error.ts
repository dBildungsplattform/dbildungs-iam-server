import { DomainError } from './domain.error.js';

export class EntityAlreadyExistsError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ENTITY_ALREADY_EXISTS', details);
    }
}

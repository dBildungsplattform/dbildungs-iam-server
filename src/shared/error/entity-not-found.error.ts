import { DomainError } from './domain.error.js';

export class EntityNotFoundError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ENTITY_NOT_FOUND', details);
    }
}
